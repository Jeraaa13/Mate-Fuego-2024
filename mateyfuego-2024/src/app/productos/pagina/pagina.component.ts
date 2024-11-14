import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  fotosUrl: string[];
  precio: number;
  tiempoElaboracion: number;
  categoria: string;
  nombreProductos?: string[];
  descripcionCategoria?: string;
}

interface Mesa {
  cantidadComensales: number;
  disponible: boolean;
  fotoUrl: string[];
  id: string;
  numero: number;
  qrCode: string;
  tipo: string;
}

@Component({
  selector: 'app-pagina',
  templateUrl: './pagina.component.html',
  styleUrls: ['./pagina.component.scss'],
  imports: [CommonModule, IonicModule, ChatComponent],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PaginaComponent implements OnInit {
  products: Product[] = [];
  currentImageIndexes: { [key: string]: number } = {};
  cart: { [key: string]: { product: Product; quantity: number } } = {};
  totalPrice: number = 0;
  totalTime: number = 0;
  isExpanded = false;
  maxTime = 0;
  mesaId: string | null = null;
  mesaNumero: number | null = null;

  constructor(
    private firestore: AngularFirestore,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getProducts().subscribe((data) => {
      this.products = data;
      this.products.forEach((product) => {
        this.currentImageIndexes[product.id] = 0;
      });
    });

    this.loadMesa();
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  loadMesa() {
    this.firestore
      .collection('mesas')
      .get()
      .subscribe((querySnapshot) => {
        const mesaData = querySnapshot.docs[0].data() as Mesa;
        this.mesaId = querySnapshot.docs[0].id;
        this.mesaNumero = mesaData.numero;
      });
  }

  async confirmOrder() {
    if (this.mesaId && this.mesaNumero !== null) {
      await this.cartService.saveOrder(this.mesaNumero);
      this.router.navigate(['cliente-espera-pedido']);
    } else {
      console.error('Mesa no seleccionada');
    }
  }

  getProducts() {
    return this.firestore
      .collection<Product>('productos')
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Product;
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        )
      );
  }

  getCategoryDescription(product: Product): string {
    return product.descripcion || 'Descripción no disponible';
  }

  nextImage(productId: string) {
    const product = this.products.find((p) => p.id === productId);
    if (product && product.fotosUrl && product.fotosUrl.length > 0) {
      this.currentImageIndexes[productId] =
        (this.currentImageIndexes[productId] + 1) % product.fotosUrl.length;
    }
  }

  previousImage(productId: string) {
    const product = this.products.find((p) => p.id === productId);
    if (product && product.fotosUrl && product.fotosUrl.length > 0) {
      this.currentImageIndexes[productId] =
        (this.currentImageIndexes[productId] - 1 + product.fotosUrl.length) %
        product.fotosUrl.length;
    }
  }

  getCurrentImageName(product: Product): string {
    const imageIndex = this.currentImageIndexes[product.id] || 0;
    return product.nombreProductos?.[imageIndex] || '';
  }

  hasFotosUrl(product: Product): boolean {
    return !!(product && product.fotosUrl && product.fotosUrl.length > 0);
  }

  hasMultipleImages(product: Product): boolean {
    return !!(product && product.fotosUrl && product.fotosUrl.length > 1);
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

  private updateTotals() {
    this.totalPrice = 0;
    this.totalTime = 0;
    Object.values(this.cart).forEach((item) => {
      this.totalPrice += item.product.precio * item.quantity;
      this.totalTime += item.product.tiempoElaboracion * item.quantity;
    });
  }

  increaseQuantity(product: Product) {
    this.cartService.addToCart(product);
    this.updateCart();
  }

  decreaseQuantity(product: Product) {
    this.cartService.removeFromCart(product.id);
    this.updateCart();
  }

  private updateCart() {
    this.cart = this.cartService.getCart();
    this.totalPrice = this.cartService.getTotalPrice();
    this.totalTime = this.cartService.getTotalTime();

    this.maxTime = Object.values(this.cart).reduce(
      (max, item) => Math.max(max, item.product.tiempoElaboracion),
      0
    );
  }
}
