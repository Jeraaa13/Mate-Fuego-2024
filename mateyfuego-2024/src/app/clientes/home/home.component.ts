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

interface UsuarioEnEspera {
  mesaAsignada: boolean;
  uid: string;
  nombre: string;
  fotourl: string;
}

interface AnonimoEnEspera {
  mesaAsignada: boolean;
  nombre: string;
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
  isAnonymousUser = false;
  userId: string = '';

  constructor(
    private qrService: QrService,
    private router: Router,
    private route: ActivatedRoute,
    private firestore: Firestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const skipVerification = params['skipVerification'] === 'true';
      const idAnonimo = params['idAnonimo'];

      if (skipVerification && idAnonimo) {
        this.isAnonymousUser = true;
        this.userId = idAnonimo;
        console.log('Usuario anonimo:', this.userId);
        await this.fetchUserDetails(idAnonimo);
      } else {
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
    }
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async onScanSuccess(result: string) {
    const resultadoScaneo = result;

    if (resultadoScaneo.includes('restaurante:12345')) {
      if (this.isAnonymousUser) {
        const nombreUsuario = this.userId;

        const usuarioEnEspera: UsuarioEnEspera = {
          mesaAsignada: false,
          uid: this.userId,
          nombre: nombreUsuario,
          fotourl: this.currentUserDetails?.fotoUrl || '',
        };

        try {
          const listaEsperaRef = collection(this.firestore, 'lista-espera');
          const nuevoDocRef = doc(listaEsperaRef, this.userId);
          await setDoc(nuevoDocRef, usuarioEnEspera);

          this.router.navigate(['/cliente-home'], {
            queryParams: {
              skipVerification: true,
              idAnonimo: this.userId,
              nombreAnonimo: nombreUsuario,
            },
          });
        } catch (error) {
          console.error(
            'Error al guardar en lista de espera (usuario anónimo):',
            error
          );
        }
      } else {
        const currentUser = await this.authService.getCurrentUser();

        if (currentUser) {
          const clienteId = currentUser.uid;
          const clienteDocRef = doc(this.firestore, 'clientes', clienteId);
          const clienteDoc = await getDoc(clienteDocRef);

          if (clienteDoc.exists()) {
            const clienteData = clienteDoc.data();
            const nombreCompleto = `${clienteData['nombre']} ${clienteData['apellido']}`;
            const listaEsperaRef = collection(this.firestore, 'lista-espera');

            await addDoc(listaEsperaRef, {
              clienteId,
              timestamp: new Date(),
            });

            console.log('aca toy');
            console.log(clienteData);

            await this.pushNotificationService.notificarClienteListaDeEspera(
              nombreCompleto
            );
          }
        } else {
          console.error('No hay un usuario logueado');
        }
      }
    } else if (result === 'encuesta:12345' && this.userId) {
      const nombreUsuario = this.isAnonymousUser
        ? this.userId
        : this.currentUserDetails?.nombre || '';

      const usuarioEnEspera: UsuarioEnEspera = {
        mesaAsignada: false,
        uid: this.userId,
        nombre: nombreUsuario,
        fotourl: this.currentUserDetails?.fotoUrl || '',
      };

      try {
        const listaEsperaRef = collection(this.firestore, 'lista-espera');
        const nuevoDocRef = doc(listaEsperaRef, this.userId);
        await setDoc(nuevoDocRef, usuarioEnEspera);

        if (this.isAnonymousUser) {
          this.router.navigate(['/cliente-home'], {
            queryParams: {
              skipVerification: true,
              idAnonimo: this.userId,
              nombreAnonimo: nombreUsuario,
            },
          });
        } else {
          this.router.navigate(['/cliente-home']);
        }
      } catch (error) {
        console.error('Error al guardar en lista de espera:', error);
      }
    } else {
      this.qrService.onScanSuccess(result);
    }

    this.toggleScanner();
  }

  async navegarhome() {
    this.qrService.onScanSuccess('restaurante:12345');

    if (this.userId && this.currentUserDetails) {
      const usuarioEnEspera: UsuarioEnEspera = {
        mesaAsignada: false,
        uid: this.userId,
        nombre: this.currentUserDetails.nombre || '',
        fotourl: this.currentUserDetails.fotoUrl || '',
      };

      try {
        const listaEsperaRef = collection(this.firestore, 'lista-espera');
        const nuevoDocRef = doc(listaEsperaRef, this.userId);
        await setDoc(nuevoDocRef, usuarioEnEspera);
        this.router.navigate(['/cliente-home']);
      } catch (error) {
        console.error('Error al guardar en lista de espera:', error);
      }
    }
  }
}
