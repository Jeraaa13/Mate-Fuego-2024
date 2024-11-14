import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
} from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { lastValueFrom, Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
interface EncuestaCliente {
  satisfaccionGeneral: number;
  nombre: string;
  recomendaria: boolean;
  serviciosUtilizados: string[];
  tipoCliente: string;
  comentarios: string;
  fotosUrls: string[];
  fechaCreacion: Date;
}

@Component({
  selector: 'app-ClientesComponent',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ClientesComponent implements OnInit {
  encuesta: EncuestaCliente = {
    satisfaccionGeneral: 50,
    nombre: '',
    recomendaria: false,
    serviciosUtilizados: [],
    tipoCliente: '',
    comentarios: '',
    fotosUrls: [],
    fechaCreacion: new Date(),
  };
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef;
  @ViewChild('servicesChart') servicesChartRef!: ElementRef;
  satisfaccionChart: Chart | null = null;
  recomendacionChart: Chart | null = null;
  serviciosChart: Chart | null = null;
  loading = false;
  servicioRestaurante: boolean = false;
  servicioBar: boolean = false;
  servicioDelivery: boolean = false;

  constructor(
    private storage: AngularFireStorage,
    private firestore: Firestore,
    private notificationService: NotificationService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.obtenerEstadisticas();
  }

  async uploadPhotos(event: any) {
    try {
      const files = event.target.files;
      if (!files) return;

      if (this.encuesta.fotosUrls.length + files.length > 3) {
        throw new Error('Solo puedes cargar hasta 3 fotos.');
      }

      this.loading = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `encuestas_clientes/foto_${new Date().getTime()}_${
          file.name
        }`;
        const fileRef = this.storage.ref(filePath);

        await fileRef.put(file);
        const photoUrl = await lastValueFrom(fileRef.getDownloadURL());

        this.encuesta.fotosUrls.push(photoUrl);
      }

      console.log('Fotos subidas exitosamente:', this.encuesta.fotosUrls);
    } catch (error) {
      console.error('Error al subir las fotos:', error);
    } finally {
      this.loading = false;
    }
  }

  removePhoto(index: number) {
    this.encuesta.fotosUrls.splice(index, 1);
  }

  async submitEncuesta(event: Event) {
    event.preventDefault();

    try {
      if (!this.validarEncuesta()) {
        this.notificationService.showError(
          'Por favor complete todos los campos requeridos',
          'Campos Incompletos'
        );
        return;
      }

      this.loading = true;
      const encuestaToSave = {
        ...this.encuesta,
        fechaCreacion: new Date(),
      };

      const encuestasCollection = collection(
        this.firestore,
        'encuestas_clientes'
      );
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
      this.encuesta.satisfaccionGeneral >= 0 &&
      this.encuesta.satisfaccionGeneral <= 100 &&
      this.encuesta.nombre.trim() !== '' &&
      this.encuesta.tipoCliente !== ''
    );
  }

  resetForm() {
    this.encuesta = {
      satisfaccionGeneral: 50,
      nombre: '',
      recomendaria: false,
      serviciosUtilizados: [],
      tipoCliente: '',
      comentarios: '',
      fotosUrls: [],
      fechaCreacion: new Date(),
    };
    this.servicioRestaurante = false;
    this.servicioBar = false;
    this.servicioDelivery = false;
  }

  onCheckboxChange(event: any, item: string) {
    const isChecked = event.detail.checked;

    if (isChecked && !this.encuesta.serviciosUtilizados.includes(item)) {
      this.encuesta.serviciosUtilizados.push(item);
    } else {
      this.encuesta.serviciosUtilizados =
        this.encuesta.serviciosUtilizados.filter(
          (servicio) => servicio !== item
        );
    }
  }

  obtenerEstadisticas() {
    const encuestasRef = collection(this.firestore, 'encuestas_clientes');
    const encuestas$ = collectionData(encuestasRef, {
      idField: 'id',
    }) as Observable<EncuestaCliente[]>;

    encuestas$.subscribe({
      next: (data) => {
        this.generarGraficos(data);
      },
      error: (error) => {
        console.error('Error al obtener estadísticas:', error);
      },
    });
  }

  private generarGraficos(data: EncuestaCliente[]) {
    if (!this.satisfactionChartRef || !this.servicesChartRef) {
      console.error('Canvas elements are not available');
      return;
    }

    const satisfaccionPromedio =
      data.reduce((acc, curr) => acc + curr.satisfaccionGeneral, 0) /
      data.length;

    if (this.satisfaccionChart) {
      this.satisfaccionChart.destroy();
    }

    this.satisfaccionChart = new Chart(
      this.satisfactionChartRef.nativeElement,
      {
        type: 'line',
        data: {
          labels: ['Promedio de Satisfacción'],
          datasets: [
            {
              label: 'Nivel de Satisfacción',
              data: [satisfaccionPromedio],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
        },
      }
    );

    const servicios = ['Restaurante', 'Bar', 'Delivery'];
    const serviciosCount = servicios.map(
      (servicio) =>
        data.filter((e) => e.serviciosUtilizados.includes(servicio)).length
    );

    if (this.serviciosChart) {
      this.serviciosChart.destroy();
    }

    this.serviciosChart = new Chart(this.servicesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: servicios,
        datasets: [
          {
            label: 'Servicios Utilizados',
            data: serviciosCount,
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
