import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Inicializa Firebase Admin
admin.initializeApp();

// Desestructuración de las variables de entorno para los datos de OAuth
const { useremail, refreshtoken, clientid, clientsecret } =
  functions.config().gmail;

// Configuración de Nodemailer con OAuth
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: useremail,
    clientId: clientid,
    clientSecret: clientsecret,
    refreshToken: refreshtoken,
  },
});

// Función Cloud Function que se activa al crear un nuevo usuario
export const sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const mailOptions = {
    from: 'mateyfuegoPPS@gmail.com',
    to: user.email,
    subject: 'Bienvenido/a a la aplicación',
    html: `<p>Gracias por registrarte, ${
      user.displayName || ''
    }! Esperamos que disfrutes de la experiencia.</p>`,
  };

  return transporter
    .sendMail(mailOptions)
    .then(() => console.log('Email enviado a:', user.email))
    .catch((error) => console.error('Error al enviar email:', error));
});
