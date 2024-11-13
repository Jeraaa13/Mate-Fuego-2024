import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  Firestore,
  collection,
  addDoc,
  getDoc,
  doc,
} from '@angular/fire/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Result, BarcodeFormat } from '@zxing/library';
import { PushNotificationService } from './push-notifications.service';

@Injectable({
  providedIn: 'root',
})
export class QrService {
  allowedFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.PDF_417];
  resultadoScaneo: string;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService
  ) {
    this.resultadoScaneo = '';
  }

  async checkPermission() {
    const status = await BarcodeScanner.checkPermission({ force: true });
    return status.granted;
  }

  async startScan() {
    const hasPermission = await this.checkPermission();
    if (hasPermission) {
      BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        this.onScanSuccess(result.content);
      }
    } else {
      console.error('Permiso de cámara no concedido.');
    }
  }

  stopScan() {
    BarcodeScanner.stopScan();
    BarcodeScanner.showBackground();
  }

  async onScanSuccess(result: string) {
    this.resultadoScaneo = result;

    if (this.resultadoScaneo.includes('restaurante:12345')) {
      const currentUser = await this.authService.getCurrentUser();

      if (currentUser) {
        const clienteId = currentUser.uid;

        const clienteDocRef = doc(this.firestore, 'clientes', clienteId);
        const clienteDoc = await getDoc(clienteDocRef);

        if (clienteDoc.exists()) {
          const clienteData = clienteDoc.data();

          const nombreCompleto = `${clienteData['nombre']} ${clienteData['apellido']}`;

          const listaEsperaRef = collection(this.firestore, 'lista-de-espera');
          await addDoc(listaEsperaRef, {
            clienteId,
            timestamp: new Date(),
          });

          console.log('aca toy');
          console.log(clienteData);

          await this.pushNotificationService.notificarClienteListaDeEspera(
            nombreCompleto
          );
        } else {
          console.error('No hay un usuario logueado');
        }
      }
    }
  }

  handleBarcodeResult(result: Result): string {
    return result.getText();
  }
}
