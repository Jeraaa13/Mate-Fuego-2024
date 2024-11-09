import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    console.log(route.queryParams);
    if (route.queryParams['skipVerification']) {
      return true;
    }

    const user = await this.authService.getCurrentUser();
    console.log(user);

    if (user) {
      const userDoc = doc(this.firestore, `clientes/${user.uid}`);
      const docSnapshot = await getDoc(userDoc);

      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData && userData['estadoVerificacion']) {
          return true;
        }
      }
    }

    console.log('Cliente no verificado');
    this.router.navigate(['/login'], { queryParams: { noVerified: true } });
    return false;
  }
}
