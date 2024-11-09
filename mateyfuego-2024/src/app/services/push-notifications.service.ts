import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  constructor(private platform: Platform, private firestore: Firestore) {}

  async inicializarNotificaciones() {
    try {
      await this.platform.ready();

      if (this.platform.is('android') || this.platform.is('ios')) {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', (token: Token) => {
            console.log('Token FCM:', token.value);
            this.guardarTokenEnServidor(token.value);
          });
          PushNotifications.addListener(
            'pushNotificationReceived',
            (notification) => {
              console.log('Notification received:', notification);
              this.mostrarNotificacion(notification);
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

  private async guardarTokenEnServidor(token: string) {
    try {
      console.log('Token saved successfully:', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private mostrarNotificacion(notificacion: any) {
    console.log('Displaying notification:', notificacion);
  }

  private manejarAccionNotificacion(action: any) {
    console.log('Handling notification action:', action);
  }

  async enviarNotificacionPrueba() {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '¡Bienvenido a Mate y Fuego!',
            body: 'Tu mesa estará lista en aproximadamente 10 minutos',
            id: 1,
            schedule: { at: new Date(Date.now() + 500) },
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  async enviarNotificacionAMultiplesDestinatarios(
    tokens: string[],
    mensaje: string,
    titulo: string
  ) {
    try {
      for (const token of tokens) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: titulo,
              body: mensaje,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 500) },
              extra: { token },
            },
          ],
        });
        console.log('Notification sent to token:', token);
      }
    } catch (error) {
      console.error(
        'Error sending notification to multiple recipients:',
        error
      );
    }
  }

  async obtenerTokensSupervisoresYDueno(): Promise<string[]> {
    const tokens: string[] = [];
    try {
      const usuariosSnapshot = await getDocs(
        collection(this.firestore, 'usuarios')
      );
      usuariosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data['tipoPerfil'] === 'supervisor' ||
          data['tipoPerfil'] === 'dueno'
        ) {
          tokens.push(data['token']);
        }
      });
    } catch (error) {
      console.error('Error getting supervisor and owner tokens:', error);
    }
    return tokens;
  }

  async obtenerTokensPorPerfil(tipos: string[], colecciones: string[]): Promise<string[]> {
    const tokens: string[] = [];
    try {
      for (const coleccion of colecciones) {
        const usuariosSnapshot = await getDocs(collection(this.firestore, coleccion));
        usuariosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (tipos.includes(data['tipoPerfil']) && data['token']) { 
            tokens.push(data['token']);
          }
        });
      }
    } catch (error) {
      console.error('Error getting tokens by profile from multiple collections:', error);
    }
    return tokens;
  }

  async agregarClienteNuevo() {
    const tokens = await this.obtenerTokensPorPerfil(
      ['supervisor', 'dueno'],
      ['empleados', 'duenosSupervisores']  
    );
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokens,
      'Nuevo cliente agregado.',
      'Notificación de Supervisión'
    );
  }
}
