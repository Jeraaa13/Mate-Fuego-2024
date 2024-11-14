import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
} from '@angular/fire/firestore';
import { IonicModule } from '@ionic/angular';
import { PushNotificationService } from '../services/push-notifications.service';
import { AuthService } from '../services/auth.service';

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

interface comida {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  tiempoElaboracion: number;
  tipo: string;
  estado: string;
}

@Component({
  selector: 'app-cocinero-home',
  templateUrl: './cocinero-home.component.html',
  styleUrls: ['./cocinero-home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class CocineroHomeComponent implements OnInit {
  orders: Order[] = [];
  private unsubscribeOrders: Unsubscribe | null = null;

  constructor(
    private firestore: Firestore,
    private pushNotificationService: PushNotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().then((user) => {
      if (user) {
        user;
        this.pushNotificationService.inicializarNotificaciones(user.uid);
      } else {
        console.error('Usuario no autenticado');
      }
    });
    this.loadOrders();
  }

  private loadOrders() {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, where('EstadoDePedido', '==', 'preparacion'));

    this.unsubscribeOrders = onSnapshot(q, (ordersSnapshot) => {
      this.orders = [];

      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();

        this.orders.push({
          orderId: doc.id,
          Mesa: orderData['Mesa'],
          EstadoDePedido: orderData['EstadoDePedido'],
          TiempoEspera: orderData['TiempoEspera'],
          Precio: orderData['Precio'],
          uidUsuario: orderData['uidUsuario'],
          items: orderData['items'],
        });
      });

      console.log('Pedidos en preparación actualizados:', this.orders);
    });
  }

  async RealizarOrden(order: Order, item: comida) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;

      const updatedItems = orderData.items.map((currentItem) => {
        if (currentItem.productId === item.productId) {
          return { ...currentItem, estado: 'realizado' };
        }
        return currentItem;
      });

      await updateDoc(orderRef, { items: updatedItems });

      this.pushNotificationService.notificarMozoDeCocina('Mozo');

      console.log(
        `Item ${item.productId} de la orden ${order.orderId} marcado como 'realizado'.`
      );
    } else {
      console.error(`No se encontró el pedido con ID: ${order.orderId}`);
    }
  }
}
