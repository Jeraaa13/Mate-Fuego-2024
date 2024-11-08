import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class QrService {
  resultadoScaneo: string;

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.resultadoScaneo = '';
  }

  async onScanSuccess(result: string) {
    this.resultadoScaneo = result;

    if (this.resultadoScaneo.includes('restaurante:12345')) {
      const currentUser = this.authService.getCurrentUser();
      console.log(currentUser);
      if (currentUser) {
        const clienteId = currentUser.uid;

        const listaEsperaRef = collection(this.firestore, 'lista-de-espera');
        await addDoc(listaEsperaRef, {
          clienteId,
          timestamp: new Date(),
        });
      } else {
        console.error('No hay un usuario logueado');
      }
    }
  }
}
