import { Injectable } from '@angular/core';
import { Auth, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userInfo: any = null;
  tipoPerfil: string | null = null;

  constructor(private auth: Auth) {}

  async getCurrentUser(): Promise<User | null> {
    return new Promise<User | null>((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        resolve(user);
      });
    });
  }

  getCurrentUserUid() {
    return this.auth.currentUser ? this.auth.currentUser.uid : null;
  }

  async getCurrentUser2(): Promise<User | null> {
    return new Promise<User | null>((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        resolve(user);
      });
    });
  }

  async obtenerInfoUsuario(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const db = getFirestore();
      const uid = user.uid;
      const collections = [
        { name: 'duenosSupervisores' },
        { name: 'empleados' },
        { name: 'clientes' },
      ];

      for (const col of collections) {
        const colRef = collection(db, col.name);
        const q = query(colRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          this.userInfo = doc.data();
          this.tipoPerfil = this.userInfo.tipoPerfil;

          break;
        }
      }
    }
  }

  async logout() {
    await signOut(this.auth);
    this.userInfo = null;
    this.tipoPerfil = null;
  }
}
