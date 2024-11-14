import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { PushNotificationService } from 'src/app/services/push-notifications.service';

interface DuenoSupervisor {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  tipoPerfil: 'dueno' | 'supervisor';
  fotoUrl: string;
  email: string;
  password: string;
  token: string;
}

@Component({
  selector: 'app-registro-dueno-supervisor',
  templateUrl: './registro-dueno-supervisor.component.html',
  styleUrls: ['./registro-dueno-supervisor.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistroDuenoSupervisorComponent implements OnInit {
  registroForm: FormGroup;
  allowedFormats = [BarcodeFormat.QR_CODE];
  isScannerVisible = false;
  slideOpts = {
    initialSlide: 0,
    speed: 400,
  };

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private auth: Auth,
    private pushNotificationService: PushNotificationService
  ) {
    this.registroForm = this.initForm();
  }

  ngOnInit() {}

  private initForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dni: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(8),
          Validators.maxLength(8),
        ],
      ],
      cuil: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{2}-[0-9]{8}-[0-9]$')],
      ],
      tipoPerfil: ['dueno', Validators.required],
      fotoUrl: ['', Validators.required],
    });
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
        const dni = this.registroForm.get('dni')?.value;
        const photoUrl = await this.uploadPhoto(
          photo.base64String,
          'duenosSupervisores',
          dni
        );
        this.registroForm.patchValue({ fotoUrl: photoUrl });
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

  async onSubmit() {
    this.markFormGroupTouched(this.registroForm);

    if (this.registroForm.valid) {
      if (!this.registroForm.get('fotoUrl')?.value) {
        console.log('Debe capturar una foto antes de registrar.');
        return;
      }

      try {
        const { email, password } = this.registroForm.value;
        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          email,
          password
        );

        const uid = userCredential.user.uid;

        const formData = {
          nombre: this.registroForm.get('nombre')?.value,
          apellido: this.registroForm.get('apellido')?.value,
          email: this.registroForm.get('email')?.value,
          dni: this.registroForm.get('dni')?.value,
          cuil: this.registroForm.get('cuil')?.value,
          tipoPerfil: this.registroForm.get('tipoPerfil')?.value,
          fotoUrl: this.registroForm.get('fotoUrl')?.value,
          password: this.registroForm.get('password')?.value,
          uid: uid,
        };

        const duenoSupervisorRef = doc(
          this.firestore,
          'duenosSupervisores',
          uid
        );
        await setDoc(duenoSupervisorRef, formData);

        console.log('Usuario creado exitosamente con UID:', uid);
        this.registroForm.reset({
          tipoPerfil: 'dueno',
        });
      } catch (error) {
        console.error('Error en el proceso de registro:', error);
      }
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  async handleQrCodeResult(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datosQr = docSnap.data() as DuenoSupervisor;
        this.registroForm.patchValue(datosQr);
      } else {
        console.error('No existe un documento con ese ID en Firestore.');
      }
    } catch (error) {
      console.error('Error al buscar el documento en Firestore:', error);
    }
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
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
