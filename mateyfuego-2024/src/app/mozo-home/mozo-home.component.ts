import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';
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
  updateDoc,
  QuerySnapshot,
} from '@angular/fire/firestore';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { IonicModule } from '@ionic/angular';
import { PushNotificationService } from '../services/push-notifications.service';

interface Order {
  orderId: string;
  EstadoDePedido: string;
  TiempoEspera: number;
  Precio: number;
  Mesa: number;
  items: {
    productId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    tiempoElaboracion: number;
    tipo: string;
    estado: string;
  }[];
  uidUsuario: string;
}

@Component({
  selector: 'app-mozo-home',
  templateUrl: './mozo-home.component.html',
  styleUrls: ['./mozo-home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ZXingScannerModule],
})
export class MozoHomeComponent implements OnInit {
  orders: Order[] = [];

  constructor(
    private firestore: Firestore,
    private pushNotificationService: PushNotificationService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
    console.log(this.orders);
  }

  private loadOrders() {
    const ordersRef = collection(this.firestore, 'pedidos');

    onSnapshot(ordersRef, (ordersSnapshot: QuerySnapshot) => {
      this.orders = ordersSnapshot.docs.map((doc) => {
        const data = doc.data() as Order;
        return {
          orderId: doc.id,
          EstadoDePedido: data.EstadoDePedido,
          TiempoEspera: data.TiempoEspera,
          Precio: data.Precio,
          Mesa: data.Mesa,
          items: data.items,
          uidUsuario: data.uidUsuario,
        };
      });
      console.log(this.orders);
    });
  }

  async acceptOrder(order: Order) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    await updateDoc(orderRef, { EstadoDePedido: 'preparacion' });
    order.EstadoDePedido = 'preparacion';

    this.pushNotificationService.notificarSectores(
      order.uidUsuario,
      'Cocinero'
    );

    this.pushNotificationService.notificarSectores(
      order.uidUsuario,
      'Bartender'
    );
  }

  async rejectOrder(order: Order) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    await updateDoc(orderRef, { EstadoDePedido: 'rechazado' });
    order.EstadoDePedido = 'rechazado';
  }
}
