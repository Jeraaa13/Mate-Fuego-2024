import { Component, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Firestore, doc, setDoc, collection } from '@angular/fire/firestore';
import { QRCodeModule } from 'angularx-qrcode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-qr-propina',
  templateUrl: './qr-propina.component.html',
  styleUrls: ['./qr-propina.component.scss'],
  standalone: true,
  imports: [QRCodeModule, CommonModule, FormsModule, IonicModule],
})
export class QrPropinaComponent {
  satisfactionLevels = [
    { label: 'Excelente', percentage: 20 },
    { label: 'Muy Bueno', percentage: 15 },
    { label: 'Bueno', percentage: 10 },
    { label: 'Regular', percentage: 5 },
    { label: 'Malo', percentage: 0 },
  ];

  selectedPercentage: number | null = null;
  qrData: string | null = null;
  showQR = false;

  @ViewChild('qrCodeElement', { static: false }) qrCodeElement?: ElementRef;

  constructor(
    private storage: AngularFireStorage,
    private firestore: Firestore
  ) {}

  generateQrCode() {
    if (this.selectedPercentage !== null) {
      this.qrData = JSON.stringify({
        satisfaction: this.getSatisfactionLabel(this.selectedPercentage),
        tipPorcentaje: this.selectedPercentage,
      });
      this.showQR = true; 
      console.log('QR Data generado:', this.qrData);
    } else {
      console.warn('No se ha seleccionado ningún nivel de satisfacción.');
    }
  }

  private getSatisfactionLabel(percentage: number): string {
    const level = this.satisfactionLevels.find(
      (level) => level.percentage === percentage
    );
    return level ? level.label : 'Desconocido';
  }

  async saveQrImageToStorage() {
    if (this.qrCodeElement && this.qrData) {
      const qrCanvas: HTMLCanvasElement = this.qrCodeElement.nativeElement.querySelector(
        'canvas'
      );
      
      if (qrCanvas) {
        const qrImageData = qrCanvas.toDataURL('image/png');
        const filePath = `propinas/qr_${new Date().getTime()}.png`;

        console.log('Guardando imagen QR en:', filePath);

        try {
          const snapshot = await this.storage
            .ref(filePath)
            .putString(qrImageData, 'data_url');
          const downloadUrl = await snapshot.ref.getDownloadURL();
          console.log('Imagen QR guardada en Firebase Storage:', downloadUrl);

          await this.saveQrUrlToFirestore(downloadUrl);
        } catch (error) {
          console.error('Error al guardar la imagen QR en Storage:', error);
        }
      } else {
        console.warn('No se encontró el elemento canvas para la imagen QR.');
      }
    } else {
      console.warn('QR Code o datos no están disponibles para guardar.');
    }
  }

  async saveQrUrlToFirestore(downloadUrl: string) {
    const qrData = {
      satisfaction: this.getSatisfactionLabel(this.selectedPercentage || 0),
      tipPorcentaje: this.selectedPercentage,
      qrUrl: downloadUrl,
      timestamp: new Date()
    };
    
    try {
      const docRef = doc(collection(this.firestore, 'propinas'));
      await setDoc(docRef, qrData);
      console.log('Datos del QR guardados en Firestore:', qrData);
    } catch (error) {
      console.error('Error al guardar los datos del QR en Firestore:', error);
    }
  }
}
