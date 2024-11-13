import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, user } from '@angular/fire/auth';
import {
  Storage,
  ref,
  uploadString,
  getDownloadURL,
} from '@angular/fire/storage';
import { ActionSheetController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BarcodeFormat } from '@zxing/library';
import { MailService } from 'src/app/services/mail.service';
import { PushNotificationService } from 'src/app/services/push-notifications.service';
import { Router } from '@angular/router';

interface Cliente {
  nombre: string;
  apellido: string;
  dni: string;
  correo: string;
  password: string;
  fotoUrl: string;
  tipoPerfil: string;
  estadoVerificacion?: false;
}

@Component({
  selector: 'app-registro-clientes',
  templateUrl: './registro-clientes.component.html',
  styleUrls: ['./registro-clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistroClientesComponent {
  registroForm: FormGroup;
  registroAnonimoForm: FormGroup;
  nuevoCliente: Cliente = {
    nombre: '',
    apellido: '',
    dni: '',
    correo: '',
    password: '',
    fotoUrl: '',
    tipoPerfil: 'cliente',
    estadoVerificacion: false,
  };
  contadorAnonimos = 0;
  isScanning = false; // Controls QR scanning visibility
  isScannerVisible = false;
  allowedFormats = [BarcodeFormat.QR_CODE];
  tipoCliente: string = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private fb: FormBuilder,
    private mailService: MailService,
    private pushNotificationService: PushNotificationService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(8),
          Validators.maxLength(8),
        ],
      ],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registroAnonimoForm = this.fb.group({
      nombre: ['', Validators.required],
    });
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  seleccionarTipoCliente(tipo: string) {
    this.tipoCliente = tipo;
  }

  async startScan() {
    const permission = await BarcodeScanner.checkPermission({ force: true });

    if (!permission.granted) {
      console.error('Camera permission not granted');
      return;
    }

    this.isScanning = true;
    document.querySelector('body')?.classList.add('scanner-active');

    try {
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        console.log('QR Code content:', result.content);
        this.parseDNIQR(result.content);
      }
    } catch (error) {
      console.error('Scanning failed:', error);
    } finally {
      this.stopScan();
    }
  }

  public stopScan() {
    BarcodeScanner.stopScan();
    BarcodeScanner.showBackground();
    this.isScanning = false;
    document.querySelector('body')?.classList.remove('scanner-active');
  }

  private parseDNIQR(content: string) {
    const parts = content.split('@');
    const apellido = parts[1] || '';
    const nombre = parts[2] || '';
    const dni = parts[4] || '';

    console.log(
      'Parsed QR data - Apellido:',
      apellido,
      'Nombre:',
      nombre,
      'DNI:',
      dni
    );
    this.updateFormWithDNIInfo({ dni, nombre, apellido });
  }

  private updateFormWithDNIInfo(info: any) {
    this.registroForm.patchValue({
      dni: info.dni,
      nombre: info.nombre,
      apellido: info.apellido,
    });
    console.log('Form fields updated with parsed QR data:', info);
  }

  validateCUIL() {
    const dni = this.registroForm.get('dni')?.value;
    const cuil = this.registroForm.get('cuil')?.value;

    if (dni && cuil && dni.length === 8) {
      const dniPart = cuil.substring(2, 10);
      if (dniPart !== dni) {
        this.registroForm.get('cuil')?.setErrors({ invalidCuil: true });
      }
    }
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
          'clientes',
          `${this.registroForm.value.nombre}`
        );
        this.nuevoCliente.fotoUrl = photoUrl;
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
    try {
      const photoRef = ref(this.storage, `imagenes/${folder}/${fileName}`);
      await uploadString(photoRef, base64String, 'base64', {
        contentType: 'image/jpeg',
      });
      const downloadUrl = await getDownloadURL(photoRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    }
  }

  async guardarCliente() {
    if (this.registroForm.invalid || !this.nuevoCliente.fotoUrl) {
      console.error('Formulario inválido o falta foto');
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

        await setDoc(datosCliente, {
          ...this.registroForm.value,
          fotoUrl: this.nuevoCliente.fotoUrl,
          estadoVerificacion: false,
          tipoPerfil: 'cliente',
          uid: uid,
        });

        await this.pushNotificationService.notificarNuevoCliente(
          `${this.registroForm.value.nombre} ${this.registroForm.value.apellido}`
        );

        await this.mailService.enviarAviso({
          email_cliente: this.registroForm.value.correo,
          to_name: this.registroForm.value.nombre,
          message:
            'Para acceder a la aplicación debe aguardar a que su cuenta sea activada',
          from_name: 'Mate y Fuego',
        });

        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
    }
  }

  async guardarClienteAnonimo() {
    if (this.registroAnonimoForm.invalid) {
      console.error('Formulario inválido');
      return;
    }

    const baseName = 'Anonimo_';
    const userEnteredName = this.registroAnonimoForm.value.nombre;
    const datosCliente = {
      nombre: userEnteredName, // Store the user-entered name
      tipoPerfil: 'anonimo',
      estadoVerificacion: true,
    };

    try {
      const anonimosSnapshot = await getDocs(
        query(
          collection(this.firestore, 'clientes'),
          where('nombre', '>=', baseName),
          where('nombre', '<', `${baseName}\uf8ff`)
        )
      );

      const contador = anonimosSnapshot.size + 1;
      const idAnonimo = `${baseName}${contador}`;

      const clienteRef = doc(this.firestore, 'clientes', idAnonimo);
      await setDoc(clienteRef, datosCliente);

      console.log('Cliente anónimo guardado en Firestore:', datosCliente);
      this.router.navigate(['/home-clientes'], {
        queryParams: { skipVerification: true, idAnonimo },
      });

      this.auth.signOut();
      this.resetForm();
    } catch (error) {
      console.error('Error al guardar cliente anónimo:', error);
    }
  }

  resetForm() {
    this.registroForm.reset();
    this.registroAnonimoForm.reset();
    this.tipoCliente = '';
  }

  handleQrCodeResult(event: any) {
    const resultText = event?.text || '';

    if (!resultText) {
      console.error('QR Code result is empty or invalid.');
      return;
    }

    this.fetchClientDataFromQRCode(resultText);
  }
  async fetchClientDataFromQRCode(result: string) {
    try {
      const docRef = doc(this.firestore, 'codigosValidos', result);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const datosQr = docSnap.data() as Cliente;
        this.nuevoCliente = { ...datosQr };
        this.registroForm.patchValue(datosQr);
        console.log('Datos obtenidos del QR:', datosQr);
      } else {
        console.error('No existe un documento con ese ID en Firestore.');
      }
    } catch (error) {
      console.error('Error al buscar el documento en Firestore:', error);
    }
    this.isScannerVisible = false;
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
