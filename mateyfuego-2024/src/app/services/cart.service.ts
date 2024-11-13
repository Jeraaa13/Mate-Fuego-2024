import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Product } from '../productos/pagina/pagina.component';
import { AuthService } from './auth.service';

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

  constructor(private firestore: AngularFirestore) {}

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
      })),
    };

    return this.firestore
      .collection('pedidos')
      .add(orderData)
      .then(() => {
        console.log('Pedido guardado exitosamente.');
        this.clearCart();
      })
      .catch((error) => {
        console.error('Error al guardar el pedido:', error);
      });
  }

  private clearCart() {
    this.cart = {};
    this.updateTotals();
  }
}
