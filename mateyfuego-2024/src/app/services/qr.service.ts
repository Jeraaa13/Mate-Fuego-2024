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

    if (this.resultadoScaneo.includes('encuesta:12345')) {
      console.log('hacer encuesta');
    }
  }

  handleBarcodeResult(result: Result): string {
    return result.getText();
  }
}
