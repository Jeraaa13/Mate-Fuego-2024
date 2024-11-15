import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly NOTIFICATION_SERVER_URL = environment.notificationServerUrl;

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private platform: Platform,
    private errorHandler: ErrorHandlerService
  ) {}

  async inicializarNotificaciones(userId: string) {
    try {
      await this.platform.ready();

      if (this.platform.is('android') || this.platform.is('ios')) {
        const permResult = await PushNotifications.requestPermissions();

        if (permResult.receive === 'granted') {
          await PushNotifications.register();

          PushNotifications.addListener(
            'registration',
            async (token: Token) => {
              console.log('Token FCM:', token.value);
              await this.guardarTokenEnFirestore(userId, token.value);
            }
          );

          PushNotifications.addListener(
            'pushNotificationReceived',
            (notification) => {
              console.log('Notification received:', notification);
            }
          );

          PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action) => {
              console.log('Notification action performed:', action);
            }
          );

          console.log('Notificaciones inicializadas');
        } else {
          console.error('Push notification permission not granted');
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.errorHandler.vibrate();
    }
  }

  async guardarTokenEnFirestore(userId: string, token: string) {
    console.log('userId => ', userId);

    try {
      const collections = ['duenosSupervisores', 'empleados', 'clientes'];
      const tokenData = {
        token: token,
        tokenLastUpdated: new Date().toISOString(),
      };

      for (const collection of collections) {
        console.log('Buscando en coleccion', collection);
        const usuarioRef = doc(this.firestore, collection, userId);
        const docSnap = await getDoc(usuarioRef);

        if (docSnap.exists()) {
          await updateDoc(usuarioRef, tokenData);
          console.log(`Token guardado correctamente en ${collection}:`, token);
          return;
        }
      }
      console.error('Usuario no encontrado en ninguna colección.');
    } catch (error) {
      console.error('Error al guardar el token en Firestore:', error);
      this.errorHandler.vibrate();
    }
  }

  async enviarNotificacionAMultiplesDestinatarios(
    tokens: string[],
    titulo: string,
    mensaje: string
  ) {
    if (!tokens || tokens.length === 0) {
      console.error('No se proporcionaron tokens para la notificación');
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

      console.log(`Notificaciones enviadas a ${tokens.length} destinatarios`);
    } catch (error) {
      console.error('Error al enviar las notificaciones:', error);
      this.errorHandler.vibrate();
    }
  }

  async notificarMaitres(nombreCliente: string, tipoPerfil: string) {
    const tokensMaitres = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensMaitres,
      'Nuevo cliente en la lista de espera',
      `Nuevo cliente: ${nombreCliente}`
    );
  }

  async notificarMozos(
    nombreCliente: string,
    tipoPerfil: string,
    mensaje: string
  ) {
    const tokensMozos = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensMozos,
      `Nueva consulta del cliente: ${nombreCliente}`,
      `Mensaje: ${mensaje}`
    );
  }

  async notificarSectores(nombreCliente: string, tipoPerfil: string) {
    const tokensSectores = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensSectores,
      'Nuevo pedido',
      `Del cliente: ${nombreCliente}`
    );
  }

  async notificarMozoDeCocina(tipoPerfil: string) {
    const tokensMozos = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensMozos,
      'Pedido realizado',
      'De parte de la cocina'
    );
  }

  async notificarMozoDeBar(tipoPerfil: string) {
    const tokensMozos = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensMozos,
      'Pedido realizado',
      'De parte del bar'
    );
  }

  async notificarDuenosYSupervisores(nombreCliente: string) {
    const tokensDuenosYSupervisores =
      await this.obtenerTokensDuenosYSupervisores();
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensDuenosYSupervisores,
      'Nuevo cliente registrado',
      `Nuevo cliente: ${nombreCliente}`
    );
  }

  private async obtenerTokensEmpleados(tipoPerfil: string): Promise<string[]> {
    const tokensEmpleados: string[] = [];
    console.log('tipo perfil tokens: ', tipoPerfil);
    try {
      const q = query(
        collection(this.firestore, 'empleados'),
        where('tipoPerfil', '==', tipoPerfil)
      );
      console.log(q);
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(data['token']);
        if (data['token']) {
          tokensEmpleados.push(data['token']);
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener los tokens de ' + tipoPerfil + ':',
        error
      );
      this.errorHandler.vibrate();
    }
    return tokensEmpleados;
  }

  private async obtenerTokensDuenosYSupervisores(): Promise<string[]> {
    const tokensDuenosYSupervisores: string[] = [];
    try {
      const q = query(collection(this.firestore, 'duenosSupervisores'));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data['token']) {
          tokensDuenosYSupervisores.push(data['token']);
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener los tokens de los dueños y supervisores:',
        error
      );
      this.errorHandler.vibrate();
    }
    return tokensDuenosYSupervisores;
  }
}
