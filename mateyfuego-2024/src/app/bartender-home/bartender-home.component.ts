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

interface Bebida {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  tiempoElaboracion: number;
  tipo: string;
  estado: string;
}

@Component({
  selector: 'app-bartender-home',
  templateUrl: './bartender-home.component.html',
  styleUrls: ['./bartender-home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class BartenderHomeComponent implements OnInit {
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

    // Suscripción a los cambios en tiempo real
    this.unsubscribeOrders = onSnapshot(q, (ordersSnapshot) => {
      // Limpiar la lista de órdenes para evitar datos previos
      this.orders = [];

      // Iterar sobre los documentos y agregarlos a la lista de órdenes
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();

        // Agregar el documento completo con sus items
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

  async RealizarOrden(order: Order, item: Bebida) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;

      // Actualizamos solo el item específico a 'realizado'
      const updatedItems = orderData.items.map((currentItem) => {
        if (currentItem.productId === item.productId) {
          return { ...currentItem, estado: 'realizado' };
        }
        return currentItem;
      });

      // Actualizamos el documento con los items modificados
      await updateDoc(orderRef, { items: updatedItems });

      this.pushNotificationService.notificarMozoDeBar('Mozo');

      console.log(
        `Item ${item.productId} de la orden ${order.orderId} marcado como 'realizado'.`
      );
    } else {
      console.error(`No se encontró el pedido con ID: ${order.orderId}`);
    }
  }
}
