import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { MailService } from 'src/app/services/mail.service';

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

  constructor(
    private firestore: AngularFirestore,
    private mailService: MailService
  ) {}

  ngOnInit(): void {
    this.cargarClientesPendientes();
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
              console.log(
                'Cliente aprobado exitosamente, enviando mail con datos del cliente...'
              );
            })
            .catch((error) => {
              console.error('Error al aprobar cliente: ', error);
            });
        } else {
          console.error('Cliente no encontrado');
        }
      })
      .catch((error) => {
        console.error('Error al obtener datos del cliente: ', error);
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

          // Send the rejection email to the client
          this.mailService.enviarConfirmacionDeshabilitado(cliente);

          // Delete the rejected client from Firestore
          this.firestore
            .collection('clientes')
            .doc(clienteId)
            .delete()
            .then(() => {
              alert('Cliente rechazado y eliminado');
            })
            .catch((error) => {
              console.error('Error al rechazar cliente: ', error);
            });
        } else {
          console.error('Cliente no encontrado');
        }
      })
      .catch((error) => {
        console.error('Error al obtener datos del cliente: ', error);
      });
  }
}
