import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MailService {
  constructor() {}

  // Método para enviar correo electrónico
  enviarCorreo(clienteId: string, aprobado: boolean) {
    // Aquí puedes integrar un servicio de backend o Firebase Functions para el envío del correo
    const estado = aprobado ? 'aprobado' : 'rechazado';
    const mensaje = `Estimado/a, su solicitud ha sido ${estado}.`;

    console.log(
      `Enviando correo a cliente ${clienteId} con mensaje: ${mensaje}`
    );

    // Aquí deberías hacer la llamada a tu servicio de backend para enviar el correo
    // Ejemplo (puede ser una llamada HTTP a tu backend o Firebase Functions):
    // this.http.post('your-backend-endpoint', { clienteId, mensaje }).subscribe();
  }
}
