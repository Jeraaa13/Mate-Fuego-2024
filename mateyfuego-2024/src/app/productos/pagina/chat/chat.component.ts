import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  where,
} from '@angular/fire/firestore';
import { PushNotificationService } from 'src/app/services/push-notifications.service';

interface Mensaje {
  texto: string;
  usuario: string;
  fecha: any;
  idUsuario: string | null;
  mesaNumero: number | null;
}

interface Usuario {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  tipoPerfil: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  chatAbierto: boolean = false;
  usuario: Usuario | null = null;
  loading: boolean = true;
  mesaNumero: number | null = 0;

  constructor(
    public authService: AuthService,
    private firestore: Firestore,
    private pushNotificationService: PushNotificationService
  ) {}

  async ngOnInit() {
    try {
      this.loading = false;
      const currentUser = await this.authService.getCurrentUser2();

      if (currentUser && currentUser.uid) {
        await this.getUserDetails(currentUser.uid);
        this.mesaNumero = await this.getMesaNumero(currentUser.uid);
      } else {
        console.error('Usuario no autenticado.');
        this.loading = false;
      }

      this.cargarMensajes();
    } catch (error) {
      console.error('Error en la inicialización:', error);
      this.loading = false;
    }
  }

  async getUserDetails(uid: string): Promise<void> {
    const collections = ['duenosSupervisores', 'empleados', 'clientes'];

    try {
      for (const collectionName of collections) {
        const userRef = collection(this.firestore, collectionName);
        const userDoc = doc(userRef, uid);
        const docSnapshot = await getDoc(userDoc);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          this.usuario = {
            id: uid,
            name: userData['nombre'] || 'Nombre desconocido',
            surname: userData['apellido'] || 'Apellido desconocido',
            email: userData['email'],
            tipoPerfil: userData['tipoPerfil'],
          };
          break;
        }
      }

      if (!this.usuario) {
        console.error('Datos de usuario no encontrados en ninguna colección.');
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    } finally {
      this.loading = false;
    }
  }

  async getMesaNumero(uid: string): Promise<number | null> {
    try {
      const pedidosRef = collection(this.firestore, 'pedidos');
      const q = query(pedidosRef, where('uidUsuario', '==', uid));

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const pedidoDoc = querySnapshot.docs[0];
        const pedidoData = pedidoDoc.data();
        return pedidoData['Mesa'] || null;
      } else {
        console.log('No se encontraron pedidos para este usuario.');
        return null;
      }
    } catch (error) {
      console.error('Error al obtener el número de mesa:', error);
      return null;
    }
  }

  async enviarMensaje() {
    if (!this.usuario) {
      console.error('No hay usuario definido');
      return;
    }

    if (this.nuevoMensaje.trim()) {
      const mensaje: Mensaje = {
        texto: this.nuevoMensaje,
        usuario: this.usuario.name || 'Anónimo',
        idUsuario: this.usuario.id,
        fecha: new Date(),
        mesaNumero: this.mesaNumero,
      };

      try {
        const mensajesCollection = collection(this.firestore, 'mensajes');
        await addDoc(mensajesCollection, mensaje);
        this.nuevoMensaje = '';

        if (this.usuario.tipoPerfil != 'mozo') {
          await this.manejarMozosNotificacion(this.usuario.name, mensaje.texto);
        }
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
      }
    }
  }

  async manejarMozosNotificacion(clientName: string, mensaje: string) {
    await this.pushNotificationService.notificarMozos(
      clientName,
      'Mozo',
      mensaje
    );
  }

  cargarMensajes() {
    const mensajesCollection = collection(this.firestore, 'mensajes');
    const mensajesQuery = query(mensajesCollection, orderBy('fecha'));

    onSnapshot(mensajesQuery, (snapshot) => {
      this.mensajes = snapshot.docs.map((doc) => doc.data() as Mensaje);

      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-mensajes');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 0);
    });
  }

  formatearHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async toggleChat(): Promise<void> {
    this.chatAbierto = !this.chatAbierto;
  }
}
