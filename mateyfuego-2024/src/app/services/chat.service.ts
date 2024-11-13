import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  async sendMessage(message: string) {
    try {
      const user: User | null = await this.authService.getCurrentUser();

      if (user) {
        const logsRef = collection(this.firestore, 'mensajes');
        await addDoc(logsRef, {
          text: message,
          user: user.email,
          timestamp: new Date(),
        });
        return true;
      } else {
        console.error('No hay usuario logeado para enviar mensajes.');
        return null;
      }
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      return null;
    }
  }

  getMessages(): Observable<any[]> {
    const mensajesRef = collection(this.firestore, 'mensajes');
    const mensajesQuery = query(mensajesRef, orderBy('timestamp', 'asc'));
    return collectionData(mensajesQuery, { idField: 'id' });
  }
}
