import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { MailService } from 'src/app/services/mail.service';
import { PushNotificationService } from 'src/app/services/push-notifications.service';
import { NotificationService } from 'src/app/services/notification.service';

interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  estadoVerificacion: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  clientesPendientes: Cliente[] = [];
  userCredential: any;

  constructor(
    private firestore: AngularFirestore,
    private mailService: MailService,
    private pushService: PushNotificationService,
    private authService: AuthService,
    private NotificationService : NotificationService
  ) {}

  ngOnInit(): void {
    this.authService
      .getCurrentUser()
      .then((user) => {
        if (user) {
          this.userCredential = user;
          this.pushService.inicializarNotificaciones(
            this.userCredential.uid,
            'dueno'
          );
          this.cargarClientesPendientes();
        } else {
          console.error('Usuario no autenticado');
        }
      })
      .catch((error) => {
        console.error('Error al obtener usuario: ', error);
      });
  }

  cargarClientesPendientes(): void {
    this.firestore
      .collection('clientes', (ref) =>
        ref.where('estadoVerificacion', '==', false)
      )
      .snapshotChanges()
      .subscribe((data) => {
        this.clientesPendientes = data.map((e) => {
          const clienteData = e.payload.doc.data() as Cliente;
          return { ...clienteData, id: e.payload.doc.id };
        });
      });

    console.log(this.clientesPendientes);
  }

  aprobarCliente(clienteId: string): void {
    this.firestore
      .collection('clientes')
      .doc(clienteId)
      .get()
      .toPromise()
      .then((docSnapshot) => {
        if (docSnapshot?.exists) {
          const cliente = docSnapshot?.data() as Cliente;
  
          this.firestore
            .collection('clientes')
            .doc(clienteId)
            .update({ estadoVerificacion: true })
            .then(() => {
              this.mailService.enviarConfirmacionHabilitado(cliente);
              this.NotificationService.showSuccess(
                'El cliente ha sido aprobado exitosamente y se envió un correo de confirmación.',
                'Cliente Aprobado'
              );
            })
            .catch((error) => {
              console.error('Error al aprobar cliente: ', error);
              this.NotificationService.showError(
                'No se pudo aprobar al cliente. Intente nuevamente.',
                'Error al Aprobar Cliente'
              );
            });
        } else {
          console.error('Cliente no encontrado');
          this.NotificationService.showError(
            'No se encontró al cliente en la base de datos.',
            'Cliente No Encontrado'
          );
        }
      })
      .catch((error) => {
        console.error('Error al obtener datos del cliente: ', error);
        this.NotificationService.showError(
          'Hubo un error al obtener los datos del cliente.',
          'Error de Consulta'
        );
      });
  }

  rechazarCliente(clienteId: string): void {
    this.firestore
      .collection('clientes')
      .doc(clienteId)
      .get()
      .toPromise()
      .then((docSnapshot) => {
        if (docSnapshot?.exists) {
          const cliente = docSnapshot?.data() as Cliente;
  
          this.mailService.enviarConfirmacionDeshabilitado(cliente);
  
          this.firestore
            .collection('clientes')
            .doc(clienteId)
            .delete()
            .then(() => {
              this.NotificationService.showSuccess(
                'El cliente ha sido rechazado y eliminado correctamente.',
                'Cliente Rechazado'
              );
            })
            .catch((error) => {
              console.error('Error al rechazar cliente: ', error);
              this.NotificationService.showError(
                'No se pudo eliminar al cliente. Intente nuevamente.',
                'Error al Rechazar Cliente'
              );
            });
        } else {
          console.error('Cliente no encontrado');
          this.NotificationService.showError(
            'No se encontró al cliente en la base de datos.',
            'Cliente No Encontrado'
          );
        }
      })
      .catch((error) => {
        console.error('Error al obtener datos del cliente: ', error);
        this.NotificationService.showError(
          'Hubo un error al obtener los datos del cliente.',
          'Error de Consulta'
        );
      });
  }
}
