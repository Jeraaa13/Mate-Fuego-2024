import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { init } from 'emailjs-com';

// Inicializa la configuración de EmailJS con tu user ID
init('PCEqSn7xdPHzXEZ2S');

@Injectable({
  providedIn: 'root',
})
export class MailService {
  constructor() {}

  enviarAviso(usuario: any) {
    let templateParams = {
      to_name: usuario.nombre,
      message:
        'Para acceder a la aplicación debe aguardar a que su cuenta sea activada',
      email_cliente: usuario.email,
      from_name: 'Mate y Fuego',
    };

    // Enviar correo usando el template y los parámetros configurados
    emailjs
      .send('service_giencvm', 'template_lwl38h8', templateParams)
      .then((res: EmailJSResponseStatus) => {
        console.log('Email enviado.', res.status, res.text);
      })
      .catch((error) => {
        console.log('Error al enviar el email.', error);
      });
  }

  enviarConfirmacionHabilitado(usuario: any) {
    let templateParams = {
      to_name: usuario.nombre,
      message: 'Usted ha sido habilitado para ingresar al local Mate y Fuego',
      email_cliente: usuario.correo,
      from_name: 'Mate y Fuego',
    };

    emailjs
      .send('service_giencvm', 'template_lwl38h8', templateParams)
      .then((res: EmailJSResponseStatus) => {
        console.log('Email enviado.', res.status, res.text);
      })
      .catch((error) => {
        console.log('Error al enviar el email.', error);
      });
  }
}
