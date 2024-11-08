import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Cliente {
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  password: string;
  fotoUrl: string;
  tipoPerfil: string;
}

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistroClientesComponent {
  nuevoCliente: Cliente = {
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    password: '',
    fotoUrl: '',
    tipoPerfil: 'cliente',
  };
  contadorAnonimos = 0;
  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController
  ) {}

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async capturePhoto(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
      });

      if (photo.base64String) {
        const photoUrl = await this.uploadPhoto(photo.base64String, 'clientes', `${this.nuevoCliente.nombre}`);
        this.nuevoCliente.fotoUrl = photoUrl;
      }
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
    }
  }

  async uploadPhoto(base64String: string, folder: string, fileName: string): Promise<string> {
    const photoRef = ref(this.storage, `imagenes/${folder}/${fileName}`);
    await uploadString(photoRef, base64String, 'base64', { contentType: 'image/jpeg' });
    return getDownloadURL(photoRef);
  }

  async guardarCliente() {
    if (!this.nuevoCliente.correo || !this.nuevoCliente.password) {
      console.error('Correo y contraseña son requeridos');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.nuevoCliente.correo,
        this.nuevoCliente.password
      );

      if (userCredential) {
        const uid = userCredential.user.uid;
        const datosCliente = doc(this.firestore, 'clientes', uid);
        await setDoc(datosCliente, this.nuevoCliente);
        console.log('Datos guardados en Firestore:', this.nuevoCliente);
        this.resetForm();
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
    }
  }

  async GuardarClienteAnonimo() {
    this.nuevoCliente = {
      nombre : this.nuevoCliente.nombre,
      apellido: '',
      dni: '',
      correo: '',
      password: '',
      fotoUrl: '',
      tipoPerfil: 'anonimo',
    };
    const datosCliente = doc(this.firestore, 'clientes', 'Anonimo ' + this.contadorAnonimos++);
    await setDoc(datosCliente, this.nuevoCliente);
    console.log('Datos guardados en Firestore:', this.nuevoCliente);
    this.resetForm();
  }

  resetForm() {
    this.nuevoCliente = {
      nombre: '',
      apellido: '',
      dni: '',
      correo: '',
      password: '',
      fotoUrl: '',
      tipoPerfil: 'cliente',
    };
  }

  async handleQrCodeResult(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Cliente;
        this.nuevoCliente = { ...datosQr };
        console.log('Datos obtenidos del QR:', datosQr);
      } else {
        console.error('No existe un documento con ese ID en Firestore.');
      }
    } catch (error) {
      console.error('Error al buscar el documento en Firestore:', error);
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
