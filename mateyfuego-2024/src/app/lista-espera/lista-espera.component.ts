import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MailService } from '../services/mail.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from '@angular/fire/firestore';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import Swal from 'sweetalert2';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.component.html',
  styleUrls: ['./lista-espera.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ZXingScannerModule,
    CommonModule,
    LoadingSpinnerComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ClienteHomeComponent implements OnInit, OnDestroy {
  currentUser: any | null = null;
  currentUserDetails: any | null = null;
  datosListado: any | null = null;
  mostrarVistaEspera: boolean = false;
  datosMesa: any | null = null;
  isScannerVisible = false;
  isAnonymousUser = false;
  userId: string | null = null;
  nombreUsuario: string | null = null;
  private listaEsperaSubscription: Unsubscribe | null = null;
  flagYaEntro: boolean = false;
  isScanning: boolean = true;

  constructor(
    private firestore: Firestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.TraerUsuarioLogueado();
  }

  ngOnDestroy(): void {
    if (this.listaEsperaSubscription) {
      this.listaEsperaSubscription();
    }
  }

  TraerUsuarioLogueado() {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.currentUser = user;
        this.userId = user.uid;
        console.log('Usuario logueado:', this.currentUser);

        const usuarioDoc = doc(this.firestore, 'clientes', this.userId);
        const docSnap = await getDoc(usuarioDoc);
        console.log('docSnap usuario => ', docSnap);

        if (docSnap.exists()) {
          this.currentUserDetails = docSnap.data();
          console.log('Detalles del usuario:', this.currentUserDetails);
          this.escucharCambiosEnEspera();
          this.verificarEstado();
        } else {
          console.log('No se encontró el usuario en la colección de clientes.');
        }
      } else {
        console.log('No hay usuario autenticado');
      }
    });
  }

  escucharCambiosEnEspera() {
    if (!this.userId) {
      console.log(
        'No hay ID de usuario para escuchar cambios en la lista de espera'
      );
      return;
    }

    const mesasRef = collection(this.firestore, 'lista-espera');
    const q = query(mesasRef, where('uid', '==', this.userId));

    this.listaEsperaSubscription = onSnapshot(
      q,
      (snapshot) => {
        console.log('Snapshot recibido:', snapshot);

        if (!snapshot.empty) {
          const listadoc = snapshot.docs[0];
          this.datosListado = {
            id: listadoc.id,
            ...listadoc.data(),
          };
          console.log('Datos actualizados:', this.datosListado);
          this.verificarEstado();

          if (this.datosListado.mesaAsignada) {
            this.traerMesa();
            this.mostrarVistaEspera = false;
          }
        } else {
          this.datosListado = null;
          this.verificarEstado();
        }
      },
      (error) => {
        console.error('Error en la suscripción:', error);
      }
    );
  }

  verificarEstado() {
    if (this.datosListado) {
      if (this.datosListado.mesaAsignada) {
        this.mostrarVistaEspera = false;
        console.log('Mesa asignada - mostrando vista principal');
      } else {
        this.mostrarVistaEspera = true;
        console.log('En espera - mostrando vista de espera');
      }
    } else {
      this.mostrarVistaEspera = false;
      console.log('Sin datos - mostrando vista principal');
    }
  }

  async onScanSuccessEspera(result: string) {
    if (!this.isScannerVisible || !this.isScanning) {
      return;
    }

    this.isScannerVisible = false;
    this.isScanning = false;

    const resultadoScaneo = result;

    if (resultadoScaneo.includes('restaurante:12345') && !this.flagYaEntro) {
      this.RutearEncuestas();
      this.flagYaEntro = true;
    } else if (this.flagYaEntro) {
      this.flagYaEntro = false;
      this.notificationService.showError(
        'Espere a ser asignado a una mesa',
        'No estás en la lista de espera'
      );
    }
    this.notificationService.showError(
      'Espere a ser asignado a una mesa',
      'No estás en la lista de espera'
    );
  }

  async traerMesa() {
    if (!this.datosListado?.mesaSeleccionada) return;

    const mesaRef = collection(this.firestore, 'mesas');
    const q = query(
      mesaRef,
      where('id', '==', this.datosListado.mesaSeleccionada)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const datosmesa = querySnapshot.docs[0];
      this.datosMesa = {
        id: datosmesa.id,
        ...datosmesa.data(),
      };
      console.log('Mesa asignada:', this.datosMesa);
    } else {
      console.log('No se encontró la mesa seleccionada');
      this.datosMesa = null;
    }
  }

  toggleScanner(): void {
    this.isScannerVisible = !this.isScannerVisible;
    this.isScanning = this.isScannerVisible;
  }

  async onScanSuccess(resultado: string) {
    console.log('Resultado QR => ', resultado);
    console.log(this.datosMesa?.qrCode);
    if (
      resultado == 'pasedeuna' ||
      this.datosMesa?.qrCode.includes(resultado)
    ) {
      console.log('qr es valido');
      this.router.navigate(['productos/pagina']);
    } else {
      this.notificationService.showWarning(
        'Este QR no es el de tu mesa',
        'QR Equivocado'
      );
    }
    this.toggleScanner();
  }

  navegarDeUna() {
    this.onScanSuccess('pasedeuna');
  }

  RutearEncuestas() {
    this.router.navigate(['/ver-encuesta-cliente']);
  }
}
