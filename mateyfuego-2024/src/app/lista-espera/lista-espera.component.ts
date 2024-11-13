import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import {
  IonSpinner,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.component.html',
  styleUrls: ['./lista-espera.component.scss'],
  standalone: true,
  imports: [
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonButton,
    IonSpinner,
    ZXingScannerModule,
    CommonModule,
  ],
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

  constructor(
    private firestore: Firestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Primero verificamos los parámetros de la ruta
    this.route.queryParams.subscribe((params) => {
      const skipVerification = params['skipVerification'] === 'true';
      const idAnonimo = params['idAnonimo'];
      const nombreAnonimo = params['nombreAnonimo'];

      if (skipVerification && idAnonimo) {
        this.isAnonymousUser = true;
        this.userId = idAnonimo;
        this.nombreUsuario = nombreAnonimo;
        this.initializeAnonymousUser();
      } else {
        this.TraerUsuarioLogueado();
      }
    });
  }

  private async initializeAnonymousUser() {
    try {
      const usuarioDoc = doc(this.firestore, 'clientes', this.userId!);
      const docSnap = await getDoc(usuarioDoc);

      if (docSnap.exists()) {
        this.currentUserDetails = docSnap.data();
        console.log('Detalles del usuario anónimo:', this.currentUserDetails);
        this.escucharCambiosEnEspera();
        this.verificarEstado();
      } else {
        console.log(
          'No se encontró el usuario anónimo en la colección de clientes.'
        );
      }
    } catch (error) {
      console.error('Error al inicializar usuario anónimo:', error);
    }
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

    this.listaEsperaSubscription = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const listadoc = snapshot.docs[0];
        this.datosListado = {
          id: listadoc.id,
          ...listadoc.data(),
        };
        console.log('Actualización en lista de espera:', this.datosListado);
        this.verificarEstado();
        this.traerMesa();
      } else {
        console.log('El usuario ya no está en la lista de espera');
        this.datosListado = null;
        this.verificarEstado();
      }
    });
  }

  verificarEstado() {
    if (this.datosListado && !this.datosListado.mesaAsignada) {
      this.mostrarVistaEspera = true;
      console.log('Mostrando vista de espera');
    } else {
      this.mostrarVistaEspera = false;
      console.log('Mostrando vista principal');
    }
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

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async onScanSuccess(resultado: string) {
    console.log('Resultado QR => ', resultado);
    console.log(this.datosMesa?.qrCode);

    if (this.datosMesa?.qrCode) {
      console.log('qr es valido');
    } else {
      console.error('QR no válido o mesa no asignada');
    }

    this.toggleScanner();
  }
}
