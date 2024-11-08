import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadString,
  getDownloadURL,
} from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';

interface Empleado {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  tipoPerfil: string;
  fotoUrl: string;
  correo: string;
  contrasena: string;
}


@Component({
  selector: 'app-alta-empleados',
  templateUrl: './alta-empleados.component.html',
  styleUrls: ['./alta-empleados.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZXingScannerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AltaEmpleadosComponent {
  empleadoForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    cuil: ['', [Validators.required, Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]$')]],
    tipoPerfil: ['', Validators.required],
    fotoUrl: ['']
  });
  
  nuevoEmpleado: Empleado = {
    nombre: '',
    apellido: '',
    dni: '',
    cuil: '',
    tipoPerfil: '',
    fotoUrl: '',
    correo: '',
    contrasena: '',
  };

  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private auth: Auth,
    private router: Router
  ) {
    this.createForm();
  }

  createForm() {
    this.empleadoForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      cuil: ['', [Validators.required, Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]$')]],
      tipoPerfil: ['', Validators.required],
      fotoUrl: ['']
    });

    // Subscribe to form changes to update nuevoEmpleado
    this.empleadoForm.valueChanges.subscribe(val => {
      this.nuevoEmpleado = { ...this.nuevoEmpleado, ...val };
    });
  }

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
        const photoUrl = await this.uploadPhoto(
          photo.base64String,
          'empleados/',
          `${this.nuevoEmpleado.dni}`
        );
        this.nuevoEmpleado.fotoUrl = photoUrl;
        this.empleadoForm.patchValue({ fotoUrl: photoUrl });
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

  async guardarEmpleado() {
    if (this.empleadoForm.invalid) {
      Object.keys(this.empleadoForm.controls).forEach(key => {
        const control = this.empleadoForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.nuevoEmpleado.fotoUrl) {
      console.error('No hay foto cargada. Sube una foto antes de guardar.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.nuevoEmpleado.correo,
        this.nuevoEmpleado.contrasena
      );

      if (userCredential) {
        const uid = userCredential.user.uid;
        const datosEmpleado = doc(this.firestore, 'empleados', uid);
        await setDoc(datosEmpleado, this.nuevoEmpleado);
        console.log('Datos guardados en Firestore:', this.nuevoEmpleado);
        this.resetForm();
      }
    } catch (error) {
      console.error('Error al registrar empleado:', error);
    }
  }

  resetForm() {
    this.empleadoForm.reset();
    this.nuevoEmpleado = {
      nombre: '',
      apellido: '',
      dni: '',
      cuil: '',
      tipoPerfil: '',
      fotoUrl: '',
      correo: '',
      contrasena: '',
    };
  }

  async handleQrCodeResult(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Empleado;
        this.nuevoEmpleado = { ...datosQr };
        this.empleadoForm.patchValue(datosQr);
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