import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadString,
  getDownloadURL,
} from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CameraSource, Camera, CameraResultType } from '@capacitor/camera';
import { QRCodeModule } from 'angularx-qrcode';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';

interface Mesa {
  id?: string;
  numero: string;
  cantidadComensales: string;
  tipo: string;
  fotoUrl: string[];
  qrCode?: string;
  disponible: boolean;
}

@Component({
  selector: 'app-registro-mesas',
  templateUrl: './registro-mesas.component.html',
  styleUrls: ['./registro-mesas.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, QRCodeModule],
})
export class RegistroMesasComponent {
  tiposDeMesa: string[] = ['Vip', 'Discapacitados', 'Estandar'];
  nuevaMesa: Mesa = {
    numero: '',
    cantidadComensales: '',
    tipo: '',
    fotoUrl: [],
    disponible: true,
  };

  qrData: string = '';
  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;
  showQR = false;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private errorHandler: ErrorHandlerService
  ) {}

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async capturePhoto(source: CameraSource) {
    try {
      if (this.nuevaMesa.fotoUrl.length >= 1) {
        console.error('No se pueden cargar más de tres fotos.');
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
      });

      if (photo.base64String) {
        const photoIndex = this.nuevaMesa.fotoUrl.length + 1;
        const fileName = `${this.nuevaMesa.numero}-${photoIndex}`;

        const photoUrl = await this.uploadPhoto(
          photo.base64String,
          'mesas',
          fileName
        );

        this.nuevaMesa.fotoUrl.push(photoUrl);
      }
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
      this.errorHandler.vibrate();
    }
  }

  async uploadPhoto(
    base64String: string,
    folder: string,
    fileName: string
  ): Promise<string> {
    const photoRef = ref(this.storage, `imagenes/${folder}/${fileName}`);
    await uploadString(photoRef, base64String, 'base64', {
      contentType: 'image/jpeg',
    });
    return getDownloadURL(photoRef);
  }

  generateQRCode() {
    const mesainfo = {
      id: this.nuevaMesa.id,
      numero: this.nuevaMesa.numero,
      cantidadComensales: this.nuevaMesa.cantidadComensales,
      tipo: this.nuevaMesa.tipo,
    };

    this.qrData = JSON.stringify(mesainfo);
    this.showQR = true;
  }

  async guardarMesa() {
    if (this.nuevaMesa.fotoUrl.length === 0) {
      console.error(
        'No hay fotos cargadas. Sube al menos una foto antes de guardar.'
      );
      return;
    }

    const mesasCollection = collection(this.firestore, 'mesas');
    const nuevoDocRef = doc(mesasCollection);
    this.nuevaMesa.id = nuevoDocRef.id;

    this.generateQRCode();
    this.nuevaMesa.qrCode = this.qrData;

    await setDoc(nuevoDocRef, this.nuevaMesa);
    console.log('Datos guardados en Firestore:', this.nuevaMesa);
    this.resetForm();
  }

  resetForm() {
    this.nuevaMesa = {
      numero: '',
      cantidadComensales: '',
      tipo: '',
      fotoUrl: [],
      disponible: true,
    };
    this.showQR = false;
    this.qrData = '';
  }

  async handleQrCodeResult(result: string) {
    try {
      const mesaData = JSON.parse(result);
      const docRef = doc(this.firestore, 'mesas', mesaData.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Mesa;
        this.nuevaMesa = { ...datosQr };
        console.log('Datos obtenidos del QR:', datosQr);
      } else {
        console.error('No existe una mesa con este numero en Firestore.');
      }
    } catch (error) {
      console.error('Error al procesar el código QR:', error);
      this.errorHandler.vibrate();
    }
  }

  async takePhoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar fuente de imagen',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => this.capturePhoto(CameraSource.Camera),
        },
        {
          text: 'Elegir de galería',
          icon: 'image',
          handler: () => this.capturePhoto(CameraSource.Photos),
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }
}
