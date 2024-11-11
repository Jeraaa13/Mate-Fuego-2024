import { Component, OnInit } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrService } from '../../services/qr.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MailService } from 'src/app/services/mail.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

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

  constructor(
    private qrService: QrService,
    private router: Router,
    private firestore: Firestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.currentUser = user;
        console.log('Usuario logueado:', this.currentUser);

        const usuarioDoc = doc(
          this.firestore,
          'clientes',
          this.currentUser.uid
        );
        const docSnap = await getDoc(usuarioDoc);

        if (docSnap.exists()) {
          this.currentUserDetails = docSnap.data();
        } else {
          console.log('No se encontró el usuario en la colección de clientes.');
        }
      } else {
        console.log('No hay usuario autenticado');
      }
    });
  }
  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  async onScanSuccess(resultado: string) {
    console.log('Resultado QR => ', resultado);

    if (resultado === 'encuesta:12345') {
      const usuarioEnEspera = {
        mesaAsignada: false,
        uid: this.currentUser.uid,
      };
      const datoslista = doc(
        this.firestore,
        'lista-espera',
        usuarioEnEspera.uid
      );
      await setDoc(datoslista, usuarioEnEspera);

      this.router.navigate(['/cliente-home']);
    } else {
      this.qrService.onScanSuccess(resultado);
    }

    this.toggleScanner();
  }

  async navegarhome() {
    if (this.currentUser) {
      const usuarioEnEspera = {
        mesaAsignada: false,
        uid: this.currentUser.uid,
        nombre: this.currentUserDetails.nombre,
        fotourl: this.currentUserDetails.fotoUrl,
      };
      const datoslista = doc(
        this.firestore,
        'lista-espera',
        usuarioEnEspera.uid
      );
      await setDoc(datoslista, usuarioEnEspera);
      this.router.navigate(['/cliente-home']);
    }
  }
}
