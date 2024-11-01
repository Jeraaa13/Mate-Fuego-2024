import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth'; // Asegúrate de tener esto importado

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User | null = null; // Almacena el usuario actual

  constructor(private auth: Auth) {
    this.auth.onAuthStateChanged((user) => {
      this.user = user; // Actualiza el usuario al cambiar el estado de autenticación
    });
  }

  // Método para obtener el usuario actual
  getCurrentUser(): User | null {
    return this.user;
  }

  async logout() {
    await signOut(this.auth);
  }
}
