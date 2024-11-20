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
  deleteDoc
} from '@angular/fire/firestore';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { IonicModule } from '@ionic/angular';
import { PushNotificationService } from '../services/push-notifications.service';
import { AuthService } from '../services/auth.service';
import { ChatComponent } from '../productos/pagina/chat/chat.component';
import { NotificationService } from '../services/notification.service';

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
  nombreCliente?: string;

}

@Component({
  selector: 'app-mozo-home',
  templateUrl: './mozo-home.component.html',
  styleUrls: ['./mozo-home.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ZXingScannerModule, ChatComponent],
})
export class MozoHomeComponent implements OnInit {
  orders: Order[] = [];
  mesa : any = null;

  constructor(
    private firestore: Firestore,
    private pushNotificationService: PushNotificationService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.authService.getCurrentUser().then((user) => {
      if (user) {
        this.pushNotificationService.inicializarNotificaciones(user.uid);
      } else {
        console.error('Usuario no autenticado');
      }
    });
    await this.loadOrders();
    console.log(this.orders);
  }

  private loadOrders() {
    const ordersRef = collection(this.firestore, 'pedidos');

    onSnapshot(ordersRef, async (ordersSnapshot: QuerySnapshot) => {
      const ordersData = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const data = doc.data() as Order;
          const nombreCliente = await this.getClientName(data.uidUsuario);
          return {
            orderId: doc.id,
            EstadoDePedido: data.EstadoDePedido,
            TiempoEspera: data.TiempoEspera,
            Precio: data.Precio,
            Mesa: data.Mesa,
            items: data.items,
            uidUsuario: data.uidUsuario,
            nombreCliente,
          };
        })
      );
      this.orders = ordersData;
    });
  }

  private async getClientName(uid: string): Promise<string> {
    const clienteRef = doc(this.firestore, 'clientes', uid);
    const clienteSnap = await getDoc(clienteRef);
    if (clienteSnap.exists()) {
      const clienteData = clienteSnap.data();
      return clienteData['nombre'] || 'Desconocido';
    }
    return 'Desconocido';
  }

  async acceptOrder(order: Order) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    await updateDoc(orderRef, { EstadoDePedido: 'preparacion' });
    order.EstadoDePedido = 'preparacion';

    if (order.nombreCliente) {
      this.pushNotificationService.notificarSectores(
        order.nombreCliente,
        'Cocinero'
      );

      this.pushNotificationService.notificarSectores(
        order.nombreCliente,
        'Bartender'
      );
    }
  }

  async rejectOrder(order: Order) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    await updateDoc(orderRef, { EstadoDePedido: 'rechazado' });
    order.EstadoDePedido = 'rechazado';
  }
  canDeliverOrder(order: Order): boolean {
    return (
      order.EstadoDePedido == 'preparacion' &&
      order.items.every((item) => item.estado === 'realizado')
    );
  }

  async deliverOrder(order: Order) {
    const orderRef = doc(this.firestore, 'pedidos', order.orderId);
    await updateDoc(orderRef, { EstadoDePedido: 'entregado' });
    order.EstadoDePedido = 'entregado';

    if (order.nombreCliente) {
      this.pushNotificationService.notificarSectores(
        `La orden de ${order.nombreCliente} ha sido entregada.`,
        'Cliente'
      );
    }
  }

  private async getMesaByNumero(numeroMesa: number): Promise<any> {
    try {
      const mesasRef = collection(this.firestore, 'mesas');
      const q = query(mesasRef, where('numero', '==', numeroMesa));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const mesaDoc = querySnapshot.docs[0];
        this.mesa =  { id: mesaDoc.id, ...mesaDoc.data() };
        return { id: mesaDoc.id, ...mesaDoc.data() };
      }

      console.warn(`No se encontró una mesa con el número: ${numeroMesa}`);
      return null;
    } catch (error) {
      console.error('Error al buscar la mesa:', error);
    }
  }


  
  async liberarMesa(order: Order) {
    try {
      const mesa = await this.getMesaByNumero(order.Mesa);

      if (mesa) {
        const mesaRef = doc(this.firestore, 'mesas', mesa.id);
        await updateDoc(mesaRef, {
          disponible: true,
          usuarioUid: '',
        });

        const orderRef = doc(this.firestore, 'pedidos', order.orderId);
        await deleteDoc(orderRef);
  
        const usuaerioref = doc(this.firestore, 'clientes', order.uidUsuario);
        await deleteDoc(usuaerioref);

        console.log(`Mesa ${order.Mesa} liberada y pedido ${order.orderId} eliminado.`);
      } else {
        console.warn('No se pudo liberar la mesa porque no se encontró.');
      }
    } catch (error) {
      console.error('Error al liberar la mesa y eliminar el pedido:', error);
    }
  }
  
}
