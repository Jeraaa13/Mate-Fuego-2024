import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosGuard implements CanActivate {
  perfilesPermitidos = ['maître', 'mozo', 'cocinero', 'bartender'];

  constructor(
    private auth: AngularFireAuth,
    private firestore: Firestore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return of(false);
        } else {
          const userDoc = doc(this.firestore, `usuarios/${user.uid}`);
          return getDoc(userDoc).then(docSnapshot => {
            if (docSnapshot.exists()) {
              const tipoPerfil = docSnapshot.data()?.['tipoPerfil'];
              if (this.perfilesPermitidos.includes(tipoPerfil)) {
                return true;
              }
            }
            this.router.navigate(['/no-autorizado']);
            return false;
          });
        }
      })
    );
  }
}
