import { Component, OnInit } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrService } from '../../services/qr.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MailService } from 'src/app/services/mail.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
} from '@angular/fire/firestore';
import { PushNotificationService } from 'src/app/services/push-notifications.service';
import { AuthService } from 'src/app/services/auth.service';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';
import { NotificationService } from 'src/app/services/notification.service';

interface UsuarioEnEspera {
  mesaAsignada: boolean;
  uid: string;
  nombre: string;
  fotourl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ZXingScannerModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  isScannerVisible = false;
  currentUser: any | null = null;
  currentUserDetails: any | null = null;
  userId: string = '';
  flagYaEntro: boolean = false;

  constructor(
    private router: Router,
    private firestore: Firestore,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private errorHandler: ErrorHandlerService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.currentUser = user;
        this.userId = user.uid;
        console.log('Usuario logueado:', this.currentUser);
        await this.fetchUserDetails(user.uid);
      } else {
        console.log('No hay usuario autenticado');
      }
    });
  }

  private async fetchUserDetails(id: string) {
    try {
      const usuarioDoc = doc(this.firestore, 'clientes', id);
      const docSnap = await getDoc(usuarioDoc);

      if (docSnap.exists()) {
        this.currentUserDetails = docSnap.data();
        console.log('Detalles del usuario cargados:', this.currentUserDetails);
      } else {
        console.log('No se encontró el usuario en la colección de clientes.');
      }
    } catch (error) {
      console.error('Error al obtener detalles del usuario:', error);
      this.errorHandler.vibrate();
    }
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async onScanSuccess(result: string) {
    if (!this.isScannerVisible) {
      return;
    }

    this.isScannerVisible = false;

    const resultadoScaneo = result;

    console.log(this.flagYaEntro);

    if (
      resultadoScaneo.includes('restaurante:12345') &&
      this.flagYaEntro == false
    ) {
      this.notificationService.showSuccess(
        'Bienvenido a la lista de espera',
        'QR escaneado exitosamente'
      );

      const currentUser = await this.authService.getCurrentUser();

      if (currentUser) {
        const clienteId = currentUser.uid;
        const clienteDocRef = doc(this.firestore, 'clientes', clienteId);
        const clienteDoc = await getDoc(clienteDocRef);

        if (clienteDoc.exists()) {
          const clienteData = clienteDoc.data();
          const listaEsperaRef = doc(this.firestore, "lista-espera", clienteId)
          const usuarioEnEspera: UsuarioEnEspera = {
            mesaAsignada: false,
            uid: clienteId,
            nombre: clienteData['nombre'] || '',
            fotourl: clienteData['fotoUrl'] || '',
          };

          console.log('Entro a la flag');
          this.flagYaEntro = true;

          try {
            await setDoc(listaEsperaRef, usuarioEnEspera);
            await this.manejarMaitreNotificacion(clienteData['nombre']);

            this.router.navigate(['/lista-espera']);
          } catch (error) {
            console.error('Error al guardar en lista de espera:', error);
            this.errorHandler.vibrate();
          }
        }
      } else {
        console.error('No hay un usuario logueado');
      }
    } else {
      this.notificationService.showWarning(
        'Este QR no es el del local',
        'QR Equivocado'
      );
    }

    // Asegurarse de que el escáner pueda volver a activarse en caso de ser necesario.
    this.toggleScanner();
  }

  async manejarMaitreNotificacion(clientName: string) {
    await this.pushNotificationService.notificarMaitres(clientName, 'Maitre');
  }

  async navegarhome() {
    this.onScanSuccess('restaurante:12345');

    if (this.userId && this.currentUserDetails) {
      const usuarioEnEspera: UsuarioEnEspera = {
        mesaAsignada: false,
        uid: this.userId,
        nombre: this.currentUserDetails.nombre || '',
        fotourl: this.currentUserDetails.fotoUrl || '',
      };

      this.notificationService.showSuccess(
        'Bienvenido a la lista de espera',
        'QR escaneado exitosamente'
      );

      try {
        this.router.navigate(['/lista-espera']);
      } catch (error) {
        console.error('Error al guardar en lista de espera:', error);
        this.errorHandler.vibrate();
      }
    }
  }
}
