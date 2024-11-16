import { Injectable } from '@angular/core';
import { Auth, signOut, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: User | null = null;

  constructor(private auth: Auth) {
    this.auth.onAuthStateChanged((user) => {
      this.user = user;
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise<User | null>((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  }

  async getCurrentUser2(): Promise<User | null> {
    return new Promise<User | null>((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        resolve(user);
      });
    });
  }

  async logout() {
    await signOut(this.auth);
  }
}
