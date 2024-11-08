import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { NgForm } from '@angular/forms';

interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  tiempoElaboracion: number;
  precio: number;
  fotosUrl: string[];
  qrCode?: string;
}

@Component({
  selector: 'app-registro-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, QRCodeModule],
  templateUrl: './registro-productos.component.html',
  styleUrls: ['./registro-productos.component.scss'],
})
export class RegistroProductosComponent {
  nuevoProducto: Producto = {
    nombre: '',
    descripcion: '',
    tiempoElaboracion: 0,
    precio: 0,
    fotosUrl: [],
  };

  qrData: string = '';
  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;
  showQR = false;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController
  ) {}

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async capturePhoto(source: CameraSource) {
    try {
      if (this.nuevoProducto.fotosUrl.length >= 3) {
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
        const photoIndex = this.nuevoProducto.fotosUrl.length + 1;
        const fileName = `${this.nuevoProducto.nombre}-${photoIndex}`;

        const photoUrl = await this.uploadPhoto(
          photo.base64String,
          'productos',
          fileName
        );

        this.nuevoProducto.fotosUrl.push(photoUrl);
      }
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
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
    const productInfo = {
      id: this.nuevoProducto.id,
      nombre: this.nuevoProducto.nombre,
      descripcion: this.nuevoProducto.descripcion,
      precio: this.nuevoProducto.precio,
      tiempoElaboracion: this.nuevoProducto.tiempoElaboracion,
    };

    this.qrData = JSON.stringify(productInfo);
    this.showQR = true;
  }

  async guardarProducto() {
    // Validaciones aquí
    if (!this.nuevoProducto.nombre || this.nuevoProducto.nombre.length < 3) {
      console.error(
        'El nombre es obligatorio y debe tener al menos 3 caracteres.'
      );
      return;
    }
    if (
      !this.nuevoProducto.descripcion ||
      this.nuevoProducto.descripcion.length < 8
    ) {
      console.error(
        'La descripción es obligatoria y debe tener al menos 8 caracteres.'
      );
      return;
    }
    if (
      !this.nuevoProducto.tiempoElaboracion ||
      this.nuevoProducto.tiempoElaboracion <= 0
    ) {
      console.error('El tiempo de elaboración debe ser positivo.');
      return;
    }
    if (
      this.nuevoProducto.precio === undefined ||
      this.nuevoProducto.precio <= 0
    ) {
      console.error('El precio debe ser mayor a 0.');
      return;
    }
    if (this.nuevoProducto.fotosUrl.length < 3) {
      console.error('Debe cargar al menos 3 fotos del producto.');
      return;
    }

    this.generateQRCode();

    const productosCollection = collection(this.firestore, 'productos');
    const nuevoDocRef = doc(productosCollection);
    this.nuevoProducto.id = nuevoDocRef.id;

    await setDoc(nuevoDocRef, this.nuevoProducto);
    console.log('Datos guardados en Firestore:', this.nuevoProducto);

    this.resetForm();
    this.resetValidations();
  }

  resetForm() {
    this.nuevoProducto = {
      nombre: '',
      descripcion: '',
      tiempoElaboracion: 0,
      precio: 0,
      fotosUrl: [],
    };
    this.showQR = false;
    this.qrData = '';
  }

  async handleQrCodeResult(result: string) {
    try {
      const productData = JSON.parse(result);
      const docRef = doc(this.firestore, 'productos', productData.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Producto;
        this.nuevoProducto = { ...datosQr };
        console.log('Datos obtenidos del QR:', datosQr);
      } else {
        console.error('No existe un producto con ese ID en Firestore.');
      }
    } catch (error) {
      console.error('Error al procesar el código QR:', error);
    }
  }

  resetValidations() {
    setTimeout(() => {
      const formControls = [
        'nombre',
        'descripcion',
        'tiempoElaboracion',
        'precio',
      ];
      formControls.forEach((control) => {
        const element = document.getElementById(control) as HTMLInputElement;
        if (element) {
          element.classList.remove('ng-touched', 'ng-dirty', 'ng-invalid');
        }
      });
    });
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
