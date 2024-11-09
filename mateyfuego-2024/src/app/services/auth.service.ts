import { Injectable } from '@angular/core';
import { Auth, signOut, User } from '@angular/fire/auth';

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

  async getCurrentUser(): Promise<User | null> {
    return new Promise<User | null>((resolve) => {
      if (this.user) {
        resolve(this.user);
      } else {
        this.auth.onAuthStateChanged((user) => {
          resolve(user);
        });
      }
    });
  }

  async logout() {
    await signOut(this.auth);
  }
}
