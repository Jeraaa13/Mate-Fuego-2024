import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Cliente {
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  password: string;
  fotoUrl: string;
  tipoPerfil: string;
  estadoVerificaicon? : false,
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
  registroForm: FormGroup;
  nuevoCliente: Cliente = {
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    password: '',
    fotoUrl: '',
    tipoPerfil: 'cliente',
    estadoVerificaicon : false,
  };
  contadorAnonimos = 0;
  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Definir el formulario y agregar validaciones
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required,Validators.minLength(3)],
      apellido: ['', Validators.required,Validators.minLength(3)],
      dni: ['', [Validators.required, Validators.pattern(/^\d+$/),Validators.maxLength(8),Validators.minLength(8)]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
        console.log('Foto capturada en base64:', photo.base64String);
        const photoUrl = await this.uploadPhoto(photo.base64String, 'clientes', `${this.registroForm.value.nombre}`);
        this.nuevoCliente.fotoUrl = photoUrl;
        console.log('Foto subida y URL obtenida:', photoUrl);
      }
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
    }
  }
  

  async uploadPhoto(base64String: string, folder: string, fileName: string): Promise<string> {
    try {
      const photoRef = ref(this.storage, `imagenes/${folder}/${fileName}`);
      await uploadString(photoRef, base64String, 'base64', { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(photoRef);
      console.log('URL de la foto obtenida de Storage:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    }
  }

  async guardarCliente() {
    if (this.registroForm.invalid) {
      console.error('Formulario inválido');
      return;
    }
    
    if (!this.nuevoCliente.fotoUrl) {
      console.error('No hay foto cargada. Sube una foto antes de guardar.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.registroForm.value.correo,
        this.registroForm.value.password
      );
  
      if (userCredential) {
        const uid = userCredential.user.uid;
        const datosCliente = doc(this.firestore, 'clientes', uid);
  
        // Verificamos que la URL de la foto esté presente antes de guardar
        console.log('Guardando cliente con datos:', {
          ...this.registroForm.value,
          fotoUrl: this.nuevoCliente.fotoUrl,
        });
  
        await setDoc(datosCliente, {
          ...this.registroForm.value,
          fotoUrl: this.nuevoCliente.fotoUrl,
        });
  
        console.log('Datos guardados en Firestore');
        this.router.navigate(['/home-clientes']);
        this.resetForm();
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
    }
  }

  async GuardarClienteAnonimo() {
    this.nuevoCliente = {
      nombre : this.registroForm.value.nombre,
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
    this.registroForm.reset();
  }

  async handleQrCodeResult(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Cliente;
        this.registroForm.patchValue(datosQr);
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
