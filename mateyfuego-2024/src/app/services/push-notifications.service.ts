import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly NOTIFICATION_SERVER_URL = environment.notificationServerUrl;

  constructor(private firestore: Firestore, private http: HttpClient) {}

  async guardarTokenEnFirestore(userId: string, token: string) {
    try {
      const usuarioRef = doc(this.firestore, 'duenosSupervisores', userId);
      await updateDoc(usuarioRef, {
        token: token,
        tokenLastUpdated: new Date().toISOString(),
      });
      console.log('Token guardado correctamente:', token);
    } catch (error) {
      console.error('Error al guardar el token en Firestore:', error);
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

  async notificarMozos(nombreCliente: string, tipoPerfil: string) {
    const tokensMozos = await this.obtenerTokensEmpleados(tipoPerfil);
    await this.enviarNotificacionAMultiplesDestinatarios(
      tokensMozos,
      'Nueva consulta',
      `Del cliente: ${nombreCliente}`
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
    const tokensMozos: string[] = [];
    try {
      const q = query(
        collection(this.firestore, 'empleados'),
        where('tipoPerfil', '==', tipoPerfil)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data['token']) {
          tokensMozos.push(data['token']);
        }
      });
    } catch (error) {
      console.error(
        'Error al obtener los tokens de ' + tipoPerfil + ':',
        error
      );
    }
    return tokensMozos;
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
    }
    return tokensDuenosYSupervisores;
  }
}
