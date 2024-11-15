import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface EncuestaCliente {
  recomendaria: boolean;
  satisfaccionGeneral: number;
  serviciosUtilizados: string[];
}

@Component({
  selector: 'app-ver-encuesta',
  templateUrl: './ver-encuesta.component.html',
  styleUrls: ['./ver-encuesta.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VerEncuestaComponent implements AfterViewInit {
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef;
  @ViewChild('servicesChart') servicesChartRef!: ElementRef;
  @ViewChild('recommendationChart') recommendationChartRef!: ElementRef;
  satisfaccionChart: Chart | null = null;
  serviciosChart: Chart | null = null;
  recommendationChart: Chart | null = null;

  constructor(private firestore: Firestore) {
    Chart.register(...registerables);
  }

  ngAfterViewInit() {
    this.obtenerEstadisticas();
  }

  obtenerEstadisticas() {
    const encuestasRef = collection(this.firestore, 'encuestas_clientes');
    const encuestas$ = collectionData(encuestasRef) as Observable<EncuestaCliente[]>;

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
    if (!this.satisfactionChartRef || !this.servicesChartRef || !this.recommendationChartRef) {
      console.error('Canvas elements are not available');
      return;
    }

    // Calculate the average satisfaction level
    const satisfaccionPromedio =
      data.reduce((acc, curr) => acc + curr.satisfaccionGeneral, 0) / data.length;

    if (this.satisfaccionChart) {
      this.satisfaccionChart.destroy();
    }

    this.satisfaccionChart = new Chart(this.satisfactionChartRef.nativeElement, {
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
          y: { beginAtZero: true, max: 100 },
        },
      },
    });

    // Services data
    const servicios = ['Restaurante', 'Bar', 'Delivery'];
    const serviciosCount = servicios.map(
      (servicio) => data.filter((e) => e.serviciosUtilizados.includes(servicio)).length
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
          y: { beginAtZero: true },
        },
      },
    });

    // Count recommendations
    const recommendationCount = { yes: 0, no: 0 };
    data.forEach((encuesta) => {
      if (encuesta.recomendaria) {
        recommendationCount.yes += 1;
      } else {
        recommendationCount.no += 1;
      }
    });

    if (this.recommendationChart) {
      this.recommendationChart.destroy();
    }

    this.recommendationChart = new Chart<'bar', number[], string>(this.recommendationChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Sí', 'No'],
        datasets: [
          {
            label: 'Recomendaciones',
            data: [recommendationCount.yes, recommendationCount.no],
            backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
            borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }
}
