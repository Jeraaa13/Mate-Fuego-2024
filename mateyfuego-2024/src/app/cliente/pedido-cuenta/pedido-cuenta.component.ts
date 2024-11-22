import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  imports: [FormsModule, CommonModule, IonicModule, ZXingScannerModule],
})
export class PedidoCuentaComponent implements OnInit {
  @Input() userUid: string | undefined;
  pedidos: Pedido[] = [];
  usuario: any;
  propina: number = 0;
  scanning: boolean = false;
  cuentaSolicitada: boolean = false;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();
    if (this.usuario.uid) {
      await this.fetchPedidos(this.usuario.uid);
    }
  }

  async fetchPedidos(uid: string) {
    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(
      pedidosCollection,
      where('uidUsuario', '==', this.usuario.uid)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No orders found for this user UID:', this.usuario.uid);
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
        const descuento = data['Descuento'] || 0;
        const totalConDescuento = data['PrecioConDescuento'] ?? subtotal;

        return { items, subtotal, descuento, totalConDescuento };
      });
      console.log('Orders to display:', this.pedidos);
    }
  }
  async handleScanResult(result: string) {
    this.scanning = false;
    console.log('Scan result:', result);

    try {
      const parsedResult = JSON.parse(result);
      if (
        parsedResult.tipPorcentaje !== undefined &&
        [5, 10, 15, 20].includes(parsedResult.tipPorcentaje)
      ) {
        this.propina = parsedResult.tipPorcentaje;
        await this.actualizarPedidoConPropina();
        this.notificationService.showSuccess(
          `Propina del ${this.propina}% aplicada`,
          'Propina añadida'
        );
      } else {
        this.notificationService.showError(
          'Código QR inválido: Propina no válida',
          'Error'
        );
      }
    } catch (error) {
      console.error('Error al parsear el QR:', error);
      this.notificationService.showError(
        'Código QR inválido: Formato incorrecto',
        'Error'
      );
    }
  }

  calcularTotalConPropina(): number {
    return this.pedidos.reduce((acc, pedido) => {
      const totalConDescuento = pedido.totalConDescuento ?? 0;
      const propinaValor = (totalConDescuento * this.propina) / 100;
      return acc + totalConDescuento + propinaValor;
    }, 0);
  }

  async actualizarPedidoConPropina() {
    const totalFinal = this.calcularTotalConPropina();

    const pedidosCollection = collection(this.firestore, 'pedidos');
    const q = query(
      pedidosCollection,
      where('uidUsuario', '==', this.usuario.uid)
    );
    const querySnapshot = await getDocs(q);

    for (const docSnapshot of querySnapshot.docs) {
      const pedidoDocRef = doc(this.firestore, `pedidos/${docSnapshot.id}`);
      try {
        await updateDoc(pedidoDocRef, {
          totalConPropina: totalFinal,
          propina: this.propina,
        });
        console.log(
          `Pedido ${docSnapshot.id} actualizado con el total: ${totalFinal}`
        );
      } catch (error) {
        console.error(
          `Error al actualizar el pedido ${docSnapshot.id}:`,
          error
        );
        this.notificationService.showError(
          'Error al guardar la propina en Firebase',
          'Error'
        );
      }
    }
  }

  iniciarEscaneo() {
    this.scanning = true;
  }

  async realizarPago() {
    try {
      const pedidosCollection = collection(this.firestore, 'pedidos');
      const q = query(
        pedidosCollection,
        where('uidUsuario', '==', this.usuario.uid)
      );
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        const pedidoRef = doc(this.firestore, 'pedidos', docSnapshot.id);
        await updateDoc(pedidoRef, {
          EstadoDePedido: 'Pagado',
        });
      }

      this.notificationService.showSuccess(
        'Cuenta solicitada exitosamente',
        'Cuenta solicitada'
      );

      this.router.navigate(['/cliente-espera-pedido'], {
        queryParams: { escaneo: false },
      });
    } catch (error) {
      console.error('Error en el pago:', error);
      this.notificationService.showError('Error al procesar el pago', 'Error');
    }
  }
}
