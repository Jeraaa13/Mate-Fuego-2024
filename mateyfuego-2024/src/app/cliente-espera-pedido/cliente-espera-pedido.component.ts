import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Firestore, collection, query, onSnapshot, updateDoc, where, doc, getDocs } from '@angular/fire/firestore';
import { QrService } from '../services/qr.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../services/error-handler.service';
import { NotificationService } from '../services/notification.service'; // Importa el servicio de notificaciones

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
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private notificationService: NotificationService // Inyecta NotificationService
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();
    if (this.usuario && this.usuario.uid) {
      console.log('Usuario autenticado exitosamente');
      this.getPedido();
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  getPedido() {
    const collectionName = 'pedidos';
    const pedidosRef = collection(this.firestore, collectionName);
    const q = query(pedidosRef, where('uidUsuario', '==', this.usuario.uid));

    onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const pedidoDoc = querySnapshot.docs[0];
          this.pedido = pedidoDoc.data();
          this.pedido.id = pedidoDoc.id;

          console.log(this.pedido.EstadoDePedido);
          if (this.pedido.EstadoDePedido == 'entregado') {
            this.confirmarRecepcion(); // Llama a la confirmación de recepción
          }
        } else {
          console.log('No se encontraron pedidos para este usuario.');
        }
      },
      (error) => {
        console.error('Error al obtener el pedido:', error);
        this.errorHandler.vibrate();
      }
    );
  }

  async confirmarRecepcion() {
    const result = await this.notificationService.showConfirm(
      '¿Has recibido tu pedido?',
      'Confirmación de Pedido',
      { confirmButtonText: 'Sí', cancelButtonText: 'No' }
    );

    if (result.isConfirmed && this.pedido && this.pedido.id) {
      const pedidoRef = doc(this.firestore, 'pedidos', this.pedido.id);
      await updateDoc(pedidoRef, { EstadoDePedido: 'recibido' });
      console.log('El estado del pedido se ha actualizado a recibido.');
    }
  }

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  onScanSuccess(resultado: string) {
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
      } else {
        console.log('No se encontraron mesas para este número.');
      }
    } catch (error) {
      console.error('Error al obtener la mesa:', error);
      this.errorHandler.vibrate();
    }
  }
}
