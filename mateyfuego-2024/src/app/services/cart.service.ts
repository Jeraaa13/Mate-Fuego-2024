import { Injectable, OnInit } from '@angular/core';
import { Product } from '../productos/pagina/pagina.component';
import { AuthService } from './auth.service';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { ErrorHandlerService } from './error-handler.service';

interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart: { [key: string]: CartItem } = {};
  private totalPrice: number = 0;
  private totalTime: number = 0;
  private usuario: any;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) {
    this.ngOnInit();
  }

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();

    console.log(this.usuario.uid);
    if (this.usuario && this.usuario.uid) {
      await this.getUserDetails(this.usuario.uid);
    } else {
      console.error('Usuario no autenticado.');
    }
  }

  async getUserDetails(uid: string): Promise<void> {
    const collections = ['duenosSupervisores', 'empleados', 'clientes'];

    try {
      for (const collectionName of collections) {
        const userRef = collection(this.firestore, collectionName);
        const userDoc = doc(userRef, uid);
        const docSnapshot = await getDoc(userDoc);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          this.usuario = {
            id: uid,
            name: userData['nombre'] || 'Nombre desconocido',
            surname: userData['apellido'] || 'Apellido desconocido',
            email: userData['email'] || 'Correo desconocido',
          };
          break;
        }
      }

      if (!this.usuario) {
        console.error('Datos de usuario no encontrados en ninguna colección.');
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      this.errorHandler.vibrate();
    }
  }

  addToCart(product: Product) {
    if (this.cart[product.id]) {
      this.cart[product.id].quantity++;
    } else {
      this.cart[product.id] = { product, quantity: 1 };
    }
    this.updateTotals();
  }

  removeFromCart(productId: string) {
    if (this.cart[productId]) {
      if (this.cart[productId].quantity > 1) {
        this.cart[productId].quantity--;
      } else {
        delete this.cart[productId];
      }
      this.updateTotals();
    }
  }

  getCart(): { [key: string]: CartItem } {
    return this.cart;
  }

  getTotalPrice(): number {
    return this.totalPrice;
  }

  getTotalTime(): number {
    return this.totalTime;
  }

  private updateTotals() {
    this.totalPrice = 0;
    this.totalTime = 0;
    Object.values(this.cart).forEach((item) => {
      this.totalPrice += item.product.precio * item.quantity;
      this.totalTime += item.product.tiempoElaboracion * item.quantity;
    });
  }

  saveOrder(mesaNumero: number) {
    const maxTiempoElaboracion = Object.values(this.cart).reduce(
      (max, item) => {
        return Math.max(max, item.product.tiempoElaboracion);
      },
      0
    );

    console.log();

    const orderData = {
      EstadoDePedido: 'solicitado',
      TiempoEspera: maxTiempoElaboracion,
      Precio: this.totalPrice,
      Mesa: mesaNumero,
      items: Object.values(this.cart).map((item) => ({
        productId: item.product.id,
        nombre: item.product.nombre,
        cantidad: item.quantity,
        precioUnitario: item.product.precio,
        tiempoElaboracion: item.product.tiempoElaboracion,
        tipo: item.product.tipo,
        estado: 'preparacion',
      })),
      uidUsuario: this.usuario.id,
    };

    const pedidosRef = collection(this.firestore, 'pedidos');
    return addDoc(pedidosRef, orderData)
      .then(async () => {
        console.log('Pedido guardado exitosamente.');

        console.log('mozo uid =>', this.usuario.uid);

        this.clearCart();
      })
      .catch((error) => {
        console.error('Error al guardar el pedido:', error);
        this.errorHandler.vibrate();
      });
  }

  private clearCart() {
    this.cart = {};
    this.updateTotals();
  }

  async getOrdersByProductType(): Promise<{ [key: string]: any[] }> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const q = query(pedidosRef, where('EstadoDePedido', '==', 'preparacion'));
    const ordersSnapshot = await getDocs(pedidosRef);

    const ordersByType: { [key: string]: any[] } = {};

    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data();
      orderData['items'].forEach((item: any) => {
        const productType = item.tipo;

        if (!ordersByType[productType]) {
          ordersByType[productType] = [];
        }

        ordersByType[productType].push({
          orderId: doc.id,
          ...item,
        });
      });
    });

    console.log('Pedidos separados por tipo de producto:', ordersByType);
    return ordersByType;
  }
}
