import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';


interface Product {
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


@Component({
  selector: 'app-pagina',
  templateUrl: './pagina.component.html',
  styleUrls: ['./pagina.component.scss'],
  standalone:true,
  imports: [CommonModule,IonicModule,],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PaginaComponent implements OnInit {
  products: Product[] = [];
  currentImageIndexes: { [key: string]: number } = {};

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.getProducts().subscribe((data) => {
      this.products = data;
      this.products.forEach(product => {
        this.currentImageIndexes[product.id] = 0;
      });
    });
  }

  getProducts() {
    return this.firestore.collection<Product>('productos').snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
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
    const product = this.products.find(p => p.id === productId);
    if (product && product.fotosUrl && product.fotosUrl.length > 0) {
      this.currentImageIndexes[productId] = 
        (this.currentImageIndexes[productId] + 1) % product.fotosUrl.length;
    }
  }

  previousImage(productId: string) {
    const product = this.products.find(p => p.id === productId);
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
}