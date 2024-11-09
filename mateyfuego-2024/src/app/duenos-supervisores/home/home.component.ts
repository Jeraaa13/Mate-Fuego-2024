import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  clientesPendiente = [];
  constructor(private firestore: Firestore) {}

  // Método para aprobar un cliente
  async aprobarCliente(clienteId: string) {
    try {
      const clienteRef = doc(this.firestore, 'clientes', clienteId);
      await setDoc(clienteRef, { aprobado: true }, { merge: true }); // Marca como aprobado
      this.enviarCorreo(clienteId, true); // Enviar correo de aprobación
    } catch (error) {
      console.error('Error al aprobar el cliente:', error);
    }
  }

  // Método para rechazar un cliente
  async rechazarCliente(clienteId: string) {
    try {
      const clienteRef = doc(this.firestore, 'clientes', clienteId);
      await setDoc(clienteRef, { aprobado: false }, { merge: true }); // Marca como rechazado
      this.enviarCorreo(clienteId, false); // Enviar correo de rechazo
    } catch (error) {
      console.error('Error al rechazar el cliente:', error);
    }
  }

  enviarCorreo(clienteId: string, aprobado: boolean) {
    const estado = aprobado ? 'aprobado' : 'rechazado';
    const mensaje = `Estimado/a, su solicitud ha sido ${estado}.`;

    // Este es un ejemplo básico de cómo podrías preparar el mensaje
    console.log(
      `Enviando correo a cliente ${clienteId} con mensaje: ${mensaje}`
    );

    // Si tienes un servicio de correo, lo llamas aquí
    // Ejemplo:
    // this.emailService.enviarEmail(clienteId, mensaje);
  }
}
