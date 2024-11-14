import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Firestore, addDoc, collection, collectionData } from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { lastValueFrom, Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';

interface EncuestaEmpleado {
  limpieza: number;
  comentario: string;
  orden: boolean;
  equipoDisponible: string[];
  turno: string;
  fotoUrl: string;
  fechaCreacion: Date; 
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HomeComponent implements OnInit {
  encuesta: EncuestaEmpleado = {
    limpieza: 50,
    comentario: '',
    orden: false,
    equipoDisponible: [],
    turno: '',
    fotoUrl: '',
    fechaCreacion: new Date()
  };
  limpiezaChart: Chart | null = null;
  ordenChart: Chart | null = null;
  loading = false;
  equipoEscoba: boolean = false;
  equipoTrapeador: boolean = false;
  equipoGuantes: boolean = false;
  
  constructor(
    private storage: AngularFireStorage, 
    private firestore: Firestore,
    private notificationService : NotificationService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.obtenerEstadisticas();
  }
  logChange(control: string, value: any) {
    console.log(`Cambio en ${control}:`, value);
  }
  async uploadPhoto(event: any) {
    try {
      if (this.encuesta.fotoUrl) {
        throw new Error('Solo puedes cargar una foto.');
      }
  
      const file = event.target.files[0];
      if (!file) return;
  
      this.loading = true;
      const filePath = `encuestas_empleados/foto_${new Date().getTime()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      
      await fileRef.put(file);
      const photoUrl = await lastValueFrom(fileRef.getDownloadURL());
      
      this.encuesta.fotoUrl = photoUrl;
      console.log('Foto subida exitosamente:', this.encuesta.fotoUrl);
    } catch (error) {
      console.error('Error al subir la foto:', error);
    } finally {
      this.loading = false;
    }
  }

  async submitEncuesta(event: Event) {
    event.preventDefault();
    
    try {
      if (!this.validarEncuesta()) {
        this.notificationService.showError(
          'Por favor complete todos los campos requeridos',
          'Campos Incompletos'
        );
        return; // Evita continuar si la validación falla
      }
  
      this.loading = true;
      const encuestaToSave = {
        ...this.encuesta,
        fechaCreacion: new Date()
      };
  
      const encuestasCollection = collection(this.firestore, 'encuestas_empleados');
      await addDoc(encuestasCollection, encuestaToSave);
    
      this.notificationService.showSuccess(
        'La encuesta ha sido enviada con éxito.',
        'Encuesta Enviada'
      );
  
      this.resetForm();
    } catch (error) {
      console.error('Error al enviar la encuesta:', error);
      this.notificationService.showError(
        'Hubo un problema al enviar la encuesta. Intente nuevamente.',
        'Error al Enviar Encuesta'
      );
    } finally {
      this.loading = false;
    }
  }
  private validarEncuesta(): boolean {
    return (
      this.encuesta.limpieza >= 0 &&
      this.encuesta.limpieza <= 100 &&
      this.encuesta.turno !== '' 
    );
  }

  resetForm() {
    this.encuesta = {
      limpieza: 50,
      comentario: '',
      orden: false,
      equipoDisponible: [],
      turno: '',
      fotoUrl: '',
      fechaCreacion: new Date()
    };
    this.equipoEscoba = false;
    this.equipoTrapeador = false;
    this.equipoGuantes = false;
  }

  onCheckboxChange(event: any, item: string) {
    const isChecked = event.detail.checked;
    
    if (isChecked && !this.encuesta.equipoDisponible.includes(item)) {
      this.encuesta.equipoDisponible.push(item);
    } else {
      this.encuesta.equipoDisponible = this.encuesta.equipoDisponible.filter(
        equipo => equipo !== item
      );
    }
    
    console.log('Equipo disponible actualizado:', this.encuesta.equipoDisponible);
  }

  obtenerEstadisticas() {
    const encuestasRef = collection(this.firestore, 'encuestas_empleados');
    const encuestas$ = collectionData(encuestasRef, { idField: 'id' }) as Observable<EncuestaEmpleado[]>;

    encuestas$.subscribe({
      next: (data) => {
        this.generarGraficos(data);
      },
      error: (error) => {
        console.error('Error al obtener estadísticas:', error);
      }
    });
  }

  private generarGraficos(data: EncuestaEmpleado[]) {
    const limpiezaPromedio = data.reduce((acc, curr) => acc + curr.limpieza, 0) / data.length;
    const ordenados = data.filter(e => e.orden).length;
    const desordenados = data.length - ordenados;

    if (this.limpiezaChart) {
      this.limpiezaChart.destroy();
    }

    this.limpiezaChart = new Chart<'bar', number[], string>('limpiezaChart', {
      type: 'bar',
      data: {
        labels: ['Promedio de Limpieza'],
        datasets: [{
          label: 'Nivel de Limpieza',
          data: [limpiezaPromedio],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    if (this.ordenChart) {
      this.ordenChart.destroy();
    }

    this.ordenChart = new Chart<'bar', number[], string>('ordenChart', {
      type: 'bar',
      data: {
        labels: ['Ordenado', 'Desordenado'],
        datasets: [{
          label: 'Orden del local',
          data: [ordenados, desordenados],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ],
          borderColor: [
            'rgb(75, 192, 192)',
            'rgb(255, 99, 132)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true
      }
    });
  }
}