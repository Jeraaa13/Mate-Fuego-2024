import { Injectable } from '@angular/core';
import { LocalNotifications, Attachment } from '@capacitor/local-notifications';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  updateDoc,
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private apiUrl = 'http://localhost:4000/api/push/role';
  private readonly NOTIFICATION_SERVER_URL = environment.notificationServerUrl;

  constructor(
    private platform: Platform,
    private firestore: Firestore,
    private http: HttpClient
  ) {}

  async inicializarNotificaciones(userId: string, userType: string) {
    console.log('Iniciando inicializarNotificaciones');
    try {
      await this.platform.ready();
      console.log('Platform ready');

      if (this.platform.is('capacitor')) {
        const permResult = await PushNotifications.requestPermissions();
        console.log('Permiso concedido');

        if (permResult.receive === 'granted') {
          await PushNotifications.register();
          console.log('Registro exitoso');

          PushNotifications.addListener(
            'registration',
            async (token: Token) => {
              console.log('Token FCM:', token.value);
              await this.guardarTokenEnServidor(token.value, userId, userType);
            }
          );

          PushNotifications.addListener(
            'pushNotificationReceived',
            (notification) => {
              console.log('Notificación recibida:', notification);
              console.log('ID:', notification.id);
              console.log('Título:', notification.title);
              console.log('Cuerpo:', notification.body);
              console.log('Datos:', notification.data);

              this.mostrarNotificacion(notification);

              if (
                notification.data &&
                notification.data.type === 'nuevoCliente'
              ) {
                console.log(
                  'Nueva notificación de cliente:',
                  notification.data
                );
              }
            }
          );

          PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action) => {
              console.log('Notification action performed:', action);
              this.manejarAccionNotificacion(action);
            }
          );
        } else {
          console.error('Push notification permission not granted');
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private async guardarTokenEnServidor(
    token: string,
    userId: string,
    userType: string
  ) {
    let collectionName = '';
    try {
      switch (userType) {
        case 'dueno':
          collectionName = 'duenosSupervisores';
          break;
        case 'supervisor':
          collectionName = 'duenosSupervisores';
          break;
        case 'cliente':
          collectionName = 'clientes';
          break;

        default:
          collectionName = 'empleados';
          break;
      }
      console.log('tipo usuario => ', userType);
      const userRef = doc(this.firestore, collectionName, userId);

      await updateDoc(userRef, {
        token: token,
        tokenLastUpdated: new Date().toISOString(),
      });

      console.log('Token saved successfully:', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private async mostrarNotificacion(notificacion: any) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notificacion.title,
            body: notificacion.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now()) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  private manejarAccionNotificacion(action: any) {
    if (action.notification.data?.type === 'newClient') {
      console.log('New client notification action:', action);
    }
  }

  async obtenerTokenMaitres(): Promise<string[]> {
    const tokens: string[] = [];
    try {
      const collections = ['empleados'];

      for (const collectionName of collections) {
        const q = query(
          collection(this.firestore, collectionName),
          where('tipoPerfil', '==', 'Maitre')
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          console.log('doc => ', doc);
          const data = doc.data();
          console.log('datatoken => ', data['token']);
          if (data['token']) {
            tokens.push(data['token']);
          }
          console.log('TOKENS =>', tokens);
        });
      }
    } catch (error) {
      console.error('Error getting supervisor and owner tokens:', error);
    }
    return tokens;
  }

  async obtenerTokensSupervisoresYDueno(): Promise<string[]> {
    const tokens: string[] = [];
    try {
      const collections = ['duenosSupervisores'];

      for (const collectionName of collections) {
        const q = query(collection(this.firestore, collectionName));

        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          console.log('doc => ', doc);
          const data = doc.data();
          console.log('datatoken => ', data['token']);
          if (data['token']) {
            tokens.push(data['token']);
          }
          console.log('TOKENS =>', tokens);
        });
      }
    } catch (error) {
      console.error('Error getting supervisor and owner tokens:', error);
    }
    return tokens;
  }

  async enviarNotificacionAMultiplesDestinatarios(
    tokens: string[],
    mensaje: string,
    titulo: string
  ) {
    if (!tokens || tokens.length === 0) {
      console.error('No tokens provided for notification');
      return;
    }

    try {
      await this.http
        .post(`${this.NOTIFICATION_SERVER_URL}/api/push/role`, {
          title: titulo,
          body: mensaje,
          tokens: tokens,
        })
        .toPromise();

      console.log(`Notifications sent to ${tokens.length} recipients`);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async notificarClienteListaDeEspera(nombreCliente: string) {
    try {
      const tokens = await this.obtenerTokenMaitres();

      if (tokens.length > 0) {
        await this.enviarNotificacionAMultiplesDestinatarios(
          tokens,
          `Nuevo cliente en la lista de espera: ${nombreCliente}`,
          'Cliente en lista de espera'
        );
      } else {
        console.log('No se encontraron destinatarios para la notificación');
      }
    } catch (error) {
      console.error('Error notifying new client:', error);
    }
  }

  async notificarNuevoCliente(nombreCliente: string) {
    try {
      const tokens = await this.obtenerTokensSupervisoresYDueno();

      if (tokens.length > 0) {
        await this.enviarNotificacionAMultiplesDestinatarios(
          tokens,
          `Nuevo cliente registrado: ${nombreCliente}`,
          'Nuevo Cliente'
        );
      } else {
        console.log('No se encontraron destinatarios para la notificación');
      }
    } catch (error) {
      console.error('Error notifying new client:', error);
    }
  }

  async obtenerYGuardarToken(userId: string) {
    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive === 'granted') {
        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Token FCM:', token.value);
          await this.guardarTokenEnFirestore(token.value, userId);
        });
      } else {
        console.error('Push notification permission not granted');
      }
    } catch (error) {
      console.error('Error obtaining and saving token:', error);
    }
  }

  private async guardarTokenEnFirestore(token: string, userId: string) {
    try {
      const userRef = doc(this.firestore, 'duenosSupervisores', userId);
      await updateDoc(userRef, {
        token: token,
        tokenLastUpdated: new Date().toISOString(),
      });
      console.log('Token saved successfully:', token);
    } catch (error) {
      console.error('Error saving token in Firestore:', error);
    }
  }

  async verificarToken(token: string) {
    try {
      console.log('Verificando token:', token);
      // Intenta enviar una notificación de prueba
      const response = await this.http
        .post(`${this.NOTIFICATION_SERVER_URL}/api/push/role`, {
          title: 'Test',
          body: 'Test notification',
          tokens: [token],
        })
        .toPromise();

      console.log('Respuesta de verificación:', response);
      return response;
    } catch (error) {
      console.error('Error al verificar token:', error);
      throw error;
    }
  }
}
