import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MailService } from '../services/mail.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { IonSpinner, IonButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-cliente-home',
  templateUrl: './cliente-home.component.html',
  styleUrls: ['./cliente-home.component.scss'],
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonContent, IonButton, IonSpinner, ZXingScannerModule, CommonModule],
})
export class ClienteHomeComponent implements OnInit {
  currentUser: any | null = null;
  currentUserDetails: any | null = null;
  datosListado: any | null = null;
  mostrarVistaEspera: boolean = false;
  datosMesa: any | null = null;

  constructor(
    private firestore: Firestore,
    private mailService: MailService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.TraerUsuarioLogueado();
  }
 
  TraerUsuarioLogueado() { 
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.currentUser = user;
        console.log('Usuario logueado:', this.currentUser);

        const usuarioDoc = doc(this.firestore, 'clientes', this.currentUser.uid);
        const docSnap = await getDoc(usuarioDoc);

        if (docSnap.exists()) {
          this.currentUserDetails = docSnap.data();
          console.log('Detalles del usuario:', this.currentUserDetails);
          await this.estaEnEspera();
          this.verificarEstado();
        } else {
          console.log('No se encontró el usuario en la colección de clientes.');
        }
      } else {
        console.log('No hay usuario autenticado');
      }
    });
  }

  async estaEnEspera() {
    try {
      if (!this.currentUser) {
        console.log('No hay usuario autenticado para buscar mesa');
        return;
      }
      const mesasRef = collection(this.firestore, 'lista-espera');
      const q = query(mesasRef, where('uid', '==', this.currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const listadoc = querySnapshot.docs[0];
        this.datosListado = {
          id: listadoc.id,
          ...listadoc.data()
        };
        console.log('Esta en lista de espera');
        console.log(this.datosListado);
        this.traerMesa();
      } else {
        console.log('El usuario no esta en la lista de espera ');
        this.datosListado = null;
      }
    } catch (error) {
      console.error('Error al obtener usuario en la lista:', error);
      this.datosListado = null;
    }
  }
  verificarEstado() {
    if (!this.datosListado.mesaAsignada) {
      this.mostrarVistaEspera = true;
      console.log('Mostrando vista de espera');
    } else {
      this.mostrarVistaEspera = false;
      console.log('Mostrando vista principal');
    }
  }

  async traerMesa() {
      const mesaRef = collection(this.firestore, 'mesas');
      const q = query(mesaRef, where('id', '==', this.datosListado.mesaSeleccionada));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const datosmesa = querySnapshot.docs[0];
        this.datosMesa = {
          id: datosmesa.id,
          ...datosmesa.data()
        };
        console.log('Mesa asignada :',this.datosMesa);
      } else {
        console.log('El usuario no esta en la lista de espera ');
        this.datosListado = null;
      }
    }
  
}