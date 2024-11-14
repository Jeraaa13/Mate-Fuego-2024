import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
interface Item {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface Pedido {
  items: Item[];
  subtotal: number;
  descuento?: number;
  totalConDescuento?: number;
}

@Component({
  selector: 'app-pedido-cuenta',
  templateUrl: './pedido-cuenta.component.html',
  styleUrls: ['./pedido-cuenta.component.scss'],
  standalone: true,
  imports:[FormsModule, CommonModule, IonicModule, ZXingScannerModule]
})
export class PedidoCuentaComponent implements OnInit {
  @Input() userUid: string | undefined; 
  pedidos: Pedido[] = []; 
  usuario: any;
  constructor(private firestore: Firestore,private authService: AuthService,private notificationService:NotificationService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();
    if (this.usuario.uid) {
      await this.fetchPedidos(this.usuario.uid);
    }
  }

  async fetchPedidos(uid: string) {
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(pedidosCollection, where('uidUsuario', '==', this.usuario.uid));
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      console.log("No orders found for this user UID:", this.usuario.uid);
    } else {
      this.pedidos = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const items: Item[] = data['items'].map((item: any) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          total: item.cantidad * item.precioUnitario,
        }));
  
        const subtotal = data['Precio'];                
        const descuento = data['Descuento'];             
        const totalConDescuento = data['PrecioConDescuento']; 
  
        return { items, subtotal, descuento, totalConDescuento };
      });
      console.log("Orders to display:", this.pedidos);
    }
  }

  Pago() {
    this.notificationService.showSuccess(
      'El pago se ha realizado con éxito',
      'Pago realizado'
    );
  }
}
