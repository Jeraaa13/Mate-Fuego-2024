// maitre-home.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PushNotificationService } from '../services/push-notifications.service';
import { NotificationService } from '../services/notification.service';

interface Mesas {
  cantidadComensales: number;
  disponible: boolean;
  fotourl: string;
  id: string;
  numero: number;
  qrCode: string;
  tipo: string;
}

interface UsuarioListado {
  mesaAsignada: boolean;
  uid: string;
  fotourl: string;
  nombre: string;
  id?: string;
  mesaSeleccionada?: string;
}

@Component({
  selector: 'app-maitre-home',
  templateUrl: './maitre-home.component.html',
  styleUrls: ['./maitre-home.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, IonicModule],
})
export class MaitreHomeComponent implements OnInit {
  listaDeEspera: UsuarioListado[] = [];
  mesasDisponibles: Mesas[] = [];
  mostrarMesas: boolean = false;
  usuarioSeleccionado: UsuarioListado | null = null;

  constructor(
    private firestore: AngularFirestore,
    private pushService: PushNotificationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.cargarListaEspera();
    this.CargarMesas();
  }

  cargarListaEspera(): void {
    this.firestore
      .collection('lista-espera')
      .snapshotChanges()
      .subscribe((data) => {
        this.listaDeEspera = data.map((e) => {
          const clienteData = e.payload.doc.data() as UsuarioListado;
          this.pushService.inicializarNotificaciones(clienteData.uid, 'Maitre');
          return { ...clienteData, id: e.payload.doc.id };
        });
      });
  }

  CargarMesas(): void {
    this.firestore
      .collection('mesas', (ref) => ref.where('disponible', '==', true))
      .snapshotChanges()
      .subscribe((data) => {
        this.mesasDisponibles = data.map((e) => {
          const mesaData = e.payload.doc.data() as Mesas;
          return { ...mesaData, id: e.payload.doc.id };
        });
      });
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/default-avatar.png';
    }
  }

  mostrarSeleccionMesas(usuario: UsuarioListado): void {
    this.usuarioSeleccionado = usuario;
    this.mostrarMesas = true;
  }

  async asignarMesaEspecifica(usuario: UsuarioListado, mesa: Mesas) {
    if (usuario.id) {
      try {
        await this.firestore.collection('mesas').doc(mesa.id).update({
          disponible: false,
        });
  
        await this.firestore.collection('lista-espera').doc(usuario.id).update({
          mesaAsignada: true,
          mesaSeleccionada: mesa.id,
        });
        this.mostrarMesas = false;
        this.usuarioSeleccionado = null;
        this.notificationService.showSuccess(
          'La mesa ha sido asignada exitosamente.',
          'Mesa Asignada'
        );
      } catch (error) {
        console.error('Error al asignar mesa:', error);
        this.notificationService.showError(
          'Hubo un problema al asignar la mesa. Intente nuevamente.',
          'Error al Asignar Mesa'
        );
      }
    }
  }

  cerrarSeleccionMesas(): void {
    this.mostrarMesas = false;
    this.usuarioSeleccionado = null;
  }
}
