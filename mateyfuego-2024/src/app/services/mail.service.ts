import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { init } from 'emailjs-com';
import { ErrorHandlerService } from './error-handler.service';

init('PCEqSn7xdPHzXEZ2S');

@Injectable({
  providedIn: 'root',
})
export class MailService {
  constructor(private errorHandler: ErrorHandlerService) {}

  enviarAviso(templateParams: {
    email_cliente: string;
    to_name: string;
    message: string;
    from_name: string;
  }) {
    emailjs
      .send('service_giencvm', 'template_afm1n1e', templateParams)
      .then((res: EmailJSResponseStatus) => {
        console.log('Email enviado.', res.status, res.text);
      })
      .catch((error) => {
        console.log('Error al enviar el email.', error);
        this.errorHandler.vibrate();
      });
  }

  enviarConfirmacionHabilitado(usuario: any) {
    let templateParams = {
      to_name: usuario.nombre,
      message: 'Usted ha sido habilitado para ingresar al local Mate y Fuego',
      email_cliente: usuario.correo,
      from_name: 'Mate y Fuego',
    };

    console.log(
      templateParams.to_name,
      ' ',
      templateParams.message,
      ' ',
      templateParams.email_cliente,
      ' ',
      templateParams.from_name
    );

    emailjs
      .send('service_giencvm', 'template_afm1n1e', templateParams)
      .then((res: EmailJSResponseStatus) => {
        console.log('Email enviado.', res.status, res.text);
      })
      .catch((error) => {
        console.log('Error al enviar el email.', error);
        this.errorHandler.vibrate();
      });
  }

  enviarConfirmacionDeshabilitado(usuario: any) {
    let templateParams = {
      to_name: usuario.nombre,
      message: 'Usted ha sido rechazado para ingresar al local Mate y Fuego',
      email_cliente: usuario.correo,
      from_name: 'Mate y Fuego',
    };

    console.log(
      templateParams.to_name,
      ' ',
      templateParams.message,
      ' ',
      templateParams.email_cliente,
      ' ',
      templateParams.from_name
    );

    emailjs
      .send('service_giencvm', 'template_afm1n1e', templateParams)
      .then((res: EmailJSResponseStatus) => {
        console.log('Email enviado.', res.status, res.text);
      })
      .catch((error) => {
        console.log('Error al enviar el email.', error);
        this.errorHandler.vibrate();
      });
  }
}
