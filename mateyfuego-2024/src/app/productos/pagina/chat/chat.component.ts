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
} from '@angular/fire/firestore';

interface Mensaje {
  texto: string;
  usuario: string;
  fecha: any;
  idUsuario: string | null;
}

interface Usuario {
  id: string;
  name: string;
  surname?: string;
  email?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  @Input() idAnonimo: string | null = null;
  @Input() nombreAnonimo: string | null = null;

  mensajes: Mensaje[] = [];
  nuevoMensaje: string = '';
  chatAbierto: boolean = false;
  usuario: Usuario | null = null;
  loading: boolean = true;

  constructor(public authService: AuthService, private firestore: Firestore) {}

  async ngOnInit() {
    try {
      // Si es usuario anónimo
      if (this.idAnonimo && this.nombreAnonimo) {
        this.usuario = {
          id: this.idAnonimo,
          name: this.nombreAnonimo,
        };
        this.loading = false;
      } else {
        // Si es usuario autenticado
        const currentUser = await this.authService.getCurrentUser2();

        if (currentUser && currentUser.uid) {
          await this.getUserDetails(currentUser.uid);
        } else {
          console.error('Usuario no autenticado.');
          this.loading = false;
        }
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
      };

      try {
        const mensajesCollection = collection(this.firestore, 'mensajes');
        await addDoc(mensajesCollection, mensaje);
        this.nuevoMensaje = '';
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
      }
    }
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
