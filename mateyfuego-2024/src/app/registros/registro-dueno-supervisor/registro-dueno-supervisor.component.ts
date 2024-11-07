import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DuenoSupervisor {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  tipoPerfil: 'dueno' | 'supervisor';
  fotoUrl: string;
}

@Component({
  selector: 'app-registro-dueno-supervisor',
  templateUrl: './registro-dueno-supervisor.component.html',
  styleUrls: ['./registro-dueno-supervisor.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistroDuenoSupervisorComponent {
  nuevoDuenoSupervisor: DuenoSupervisor = {
    nombre: '',
    apellido: '',
    dni: '',
    cuil: '',
    tipoPerfil: 'dueno',
    fotoUrl: '',
  };

  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;
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
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
      });

      if (photo.base64String) {
        const photoUrl = await this.uploadPhoto(photo.base64String, 'duenosSupervisores', `${this.nuevoDuenoSupervisor.dni}`);
        this.nuevoDuenoSupervisor.fotoUrl = photoUrl;
        await this.guardarDuenoSupervisor();
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

  async guardarDuenoSupervisor() {
    if (!this.nuevoDuenoSupervisor.fotoUrl) {
      console.error("No hay foto cargada. Sube una foto antes de guardar.");
      return;
    }

    const duenoSupervisorRef = doc(this.firestore, 'duenosSupervisores', this.nuevoDuenoSupervisor.dni);
    await setDoc(duenoSupervisorRef, this.nuevoDuenoSupervisor);
    console.log("Datos guardados en Firestore:", this.nuevoDuenoSupervisor);
    this.resetForm();
  }

  resetForm() {
    this.nuevoDuenoSupervisor = {
      nombre: '',
      apellido: '',
      dni: '',
      cuil: '',
      tipoPerfil: 'dueno',
      fotoUrl: '',
    };
  }

  async handleQrCodeResult(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as DuenoSupervisor;
        this.nuevoDuenoSupervisor = { ...datosQr };
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
          handler: () => this.capturePhoto(CameraSource.Camera)
        },
        {
          text: 'Elegir de galería',
          icon: 'image',
          handler: () => this.capturePhoto(CameraSource.Photos)
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
}
