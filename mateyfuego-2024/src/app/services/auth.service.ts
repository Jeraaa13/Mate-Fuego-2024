import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user: User | null = null;

  constructor(private auth: Auth) {
    this.auth.onAuthStateChanged((user) => {
      this.user = user;
    });
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  async logout() {
    await signOut(this.auth);
  }
}
