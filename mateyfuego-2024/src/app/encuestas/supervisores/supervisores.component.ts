import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Firestore, Timestamp, addDoc, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import { Observable } from 'rxjs';
import { NotificationService } from '../../services/notification.service'; // Asegúrate de importar el servicio

interface Usuario {
  id: string;
  nombre: string;
  tipo: 'empleado' | 'cliente';
}

interface Evaluacion {
  fechaCreacion?: Timestamp | Date | undefined;
  usuarioId: string;
  usuarioTipo: 'empleado' | 'cliente';
  calificacion: number;
  desempeno: string;
  cumpleObjetivos: boolean;
  areasEvaluadas: string[];
  observaciones: string;
  fechaEvaluacion: Date;
}

@Component({
  selector: 'app-supervisor',
  templateUrl: './supervisores.component.html',
  styleUrls: ['./supervisores.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})

export class SupervisorComponent implements OnInit {
  empleados$: Observable<Usuario[]> | undefined;
  clientes$: Observable<Usuario[]> | undefined;
  usuarioSeleccionado: Usuario | null = null;
  tipoUsuarioSeleccionado: 'empleado' | 'cliente' = 'empleado';
  evaluacion: Evaluacion = {
    usuarioId: '',
    usuarioTipo: 'empleado',
    calificacion: 50,
    desempeno: '',
    cumpleObjetivos: false,
    areasEvaluadas: [],
    observaciones: '',
    fechaEvaluacion: new Date(),
    fechaCreacion: undefined
  };

  areaAtencion: boolean = false;
  areaPuntualidad: boolean = false;
  areaCalidad: boolean = false;
  calificacionChart: Chart | null = null;
  cumplimientoChart: Chart | null = null;
  areasChart: Chart | null = null;
  
  loading = false;

  constructor(
    private firestore: Firestore,
    private notificationService: NotificationService // Inyecta NotificationService
  ) {
    Chart.register(...registerables);
    this.cargarUsuarios();
  }

  ngOnInit() {}

  cargarUsuarios() {
    const empleadosRef = collection(this.firestore, 'empleados');
    this.empleados$ = collectionData(empleadosRef, { idField: 'id' }) as Observable<Usuario[]>;
    const clientesRef = collection(this.firestore, 'clientes');
    this.clientes$ = collectionData(clientesRef, { idField: 'id' }) as Observable<Usuario[]>;
  }

  seleccionarTipoUsuario(tipo: any) {
    if (typeof tipo === 'string' && (tipo === 'empleado' || tipo === 'cliente')) {
      this.tipoUsuarioSeleccionado = tipo;
    } else {
      this.tipoUsuarioSeleccionado = 'empleado'; 
    }
    this.usuarioSeleccionado = null;
    this.resetForm();
    console.log("Tipo de usuario seleccionado:", this.tipoUsuarioSeleccionado);
  }

  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.evaluacion.usuarioId = usuario.id;
    this.evaluacion.usuarioTipo = this.tipoUsuarioSeleccionado || 'empleado'; 
    this.obtenerEstadisticas();
  }

  onCheckboxChange(event: any, area: string) {
    const isChecked = event.detail.checked;
    
    if (isChecked && !this.evaluacion.areasEvaluadas.includes(area)) {
      this.evaluacion.areasEvaluadas.push(area);
    } else {
      this.evaluacion.areasEvaluadas = this.evaluacion.areasEvaluadas.filter(
        areaActual => areaActual !== area
      );
    }
  }

  async submitEvaluacion(event: Event) {
    event.preventDefault();
  
    try {
      if (!this.validarEvaluacion()) {
        this.notificationService.showError('Por favor complete todos los campos requeridos', 'Error de Validación');
        return;
      }
  
      this.loading = true;
  
      const evaluacionToSave = {
        ...this.evaluacion,
        usuarioTipo: this.evaluacion.usuarioTipo || 'empleado',
        fechaEvaluacion: new Date(),
        fechaCreacion: this.evaluacion.fechaCreacion || new Date()
      };
  
      const evaluacionesCollection = collection(this.firestore, 'encuestas_supervisores');
      await addDoc(evaluacionesCollection, evaluacionToSave);
  
      this.notificationService.showSuccess('Evaluación guardada con éxito', 'Éxito');
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar la evaluación:', error);
      this.notificationService.showError('Error al guardar la evaluación. Inténtelo de nuevo.', 'Error');
    } finally {
      this.loading = false;
    }
  }

  private validarEvaluacion(): boolean {
    return (
      this.evaluacion.usuarioId !== '' &&
      this.evaluacion.calificacion >= 0 &&
      this.evaluacion.calificacion <= 100 &&
      this.evaluacion.desempeno !== ''
    );
  }

  resetForm() {
    this.evaluacion = {
      usuarioId: this.usuarioSeleccionado?.id || '',
      usuarioTipo: this.tipoUsuarioSeleccionado || 'empleado',
      calificacion: 50,
      desempeno: '',
      cumpleObjetivos: false,
      areasEvaluadas: [],
      observaciones: '',
      fechaEvaluacion: new Date(),
      fechaCreacion: undefined 
    };
    this.areaAtencion = false;
    this.areaPuntualidad = false;
    this.areaCalidad = false;
  }

  obtenerEstadisticas() {
    if (!this.usuarioSeleccionado) return;

    const evaluacionesRef = collection(this.firestore, 'encuestas_supervisores');
    const evaluacionesQuery = query(
      evaluacionesRef, 
      where('usuarioId', '==', this.usuarioSeleccionado.id)
    );

    collectionData(evaluacionesQuery).subscribe({
      next: (data: any[]) => {
        this.generarGraficos(data);
      },
      error: (error) => {
        console.error('Error al obtener estadísticas:', error);
        this.notificationService.showError('Error al obtener estadísticas', 'Error');
      }
    });
  }

  private generarGraficos(data: Evaluacion[]) {
    console.log("Datos recibidos para gráficos:", data);
    
    if (data.length === 0) {
      console.warn("No hay datos de calificaciones para mostrar en el historial."); 
      this.notificationService.showInfo('No hay datos de calificaciones para mostrar en el historial.', 'Información');
      return; 
    }

    setTimeout(() => {
      try {
        const calificacionPromedio = data.reduce((acc, curr) => acc + curr.calificacion, 0) / data.length;
        console.log("Calificación promedio calculada:", calificacionPromedio);

        if (this.calificacionChart) {
          this.calificacionChart.destroy();
        }
  
        this.calificacionChart = new Chart('calificacionChart', {
          type: 'bar',
          data: {
            labels: data.map(d => {
              const date = d.fechaCreacion
                ? (d.fechaCreacion instanceof Timestamp 
                    ? new Date(d.fechaCreacion.seconds * 1000) 
                    : new Date(d.fechaCreacion))
                : new Date();
              return date.toLocaleDateString();
            }),
            datasets: [{
              label: 'Calificación',
              data: data.map(d => d.calificacion),
              backgroundColor: 'rgba(34, 139, 34, 0.5)', 
              borderColor: 'rgb(34, 139, 34)',
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
  
        console.log("Historial de calificaciones cargado correctamente.");
        const cumplimientos = data.filter(e => e.cumpleObjetivos).length;
        const noCumplimientos = data.length - cumplimientos;
  
        if (this.cumplimientoChart) {
          this.cumplimientoChart.destroy();
        }
  
        this.cumplimientoChart = new Chart('cumplimientoChart', {
          type: 'bar',
          data: {
            labels: ['Cumple Objetivos', 'No Cumple'],
            datasets: [{
              label: 'Cumplimientos',
              data: [cumplimientos, noCumplimientos],
              backgroundColor: [
                'rgba(75, 192, 192, 0.5)',
                'rgba(255, 99, 132, 0.5)'
              ]
            }]
          },
          options: {
            responsive: true
          }
        });
  
        const areas = ['Atención', 'Puntualidad', 'Calidad'];
        const areasCount = areas.map(area => 
          data.filter(e => e.areasEvaluadas.includes(area)).length
        );
  
        if (this.areasChart) {
          this.areasChart.destroy();
        }
  
        this.areasChart = new Chart('areasChart', {
          type: 'bar',
          data: {
            labels: areas,
            datasets: [{
              label: 'Áreas Evaluadas',
              data: areasCount,
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgb(153, 102, 255)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      } catch (error) {
        console.error("Error al generar el gráfico de historial de calificaciones:", error);
        this.notificationService.showError('Error al generar el gráfico de historial de calificaciones', 'Error');
      }
    }, 0); 
  }
}
