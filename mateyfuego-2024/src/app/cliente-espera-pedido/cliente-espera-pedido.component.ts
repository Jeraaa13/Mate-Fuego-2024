import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { QrService } from '../services/qr.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';
@Component({
  selector: 'app-cliente-espera-pedido',
  standalone: true,
  imports: [FormsModule, CommonModule, IonicModule, ZXingScannerModule],
  templateUrl: './cliente-espera-pedido.component.html',
  styleUrls: ['./cliente-espera-pedido.component.scss'],
})
export class ClienteEsperaPedidoComponent implements OnInit {
  pedido: any;
  usuario: any;
  mesa: any;
  isScannerVisible = false;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private qrService: QrService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();

    console.log(this.usuario);
    if (this.usuario && this.usuario.uid) {
      console.log('Usuario autenticado exitosamente');

      await this.getPedido();
      console.log(this.pedido.Mesa);
      await this.getQrCode(this.pedido.Mesa);
    }
  }
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
  async getPedido() {
    try {
      const collectionName = 'pedidos';
      const pedidosRef = collection(this.firestore, collectionName);
      const q = query(pedidosRef, where('uidUsuario', '==', this.usuario.uid));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const pedidoDoc = querySnapshot.docs[0];
        this.pedido = pedidoDoc.data();
        this.pedido.id = pedidoDoc.id; 
      } else {
        console.log('No se encontraron pedidos para este usuario.');
      }
    } catch (error) {
      console.error('Error al obtener el pedido:', error);
    }
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  onScanSuccess(resultado: string) {
    console.log('resultado qr=> ', resultado);

    if (resultado.includes(this.mesa.qrCode)) {
      console.log('QR SUCCESS');
    }
  }

  async getQrCode(mesaNumero: number) {
    try {
      const collectionName = 'mesas';

      const mesasRef = collection(this.firestore, collectionName);
      const q = query(mesasRef, where('numero', '==', mesaNumero));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const mesasDoc = querySnapshot.docs[0];
        this.mesa = mesasDoc.data();

        console.log(this.mesa);
      } else {
        console.log('No se encontraron pedidos para este usuario.');
      }
    } catch (error) {
      console.error('Error al obtener el pedido:', error);
    }
  }

  Recibir() {
    console.log('vale tio');
  }
}
