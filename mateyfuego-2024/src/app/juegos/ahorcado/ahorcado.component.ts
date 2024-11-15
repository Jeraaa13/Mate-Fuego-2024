import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import {
  Firestore,
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ahorcado.component.html',
  styleUrls: ['./ahorcado.component.css'],
})
export class AhorcadoComponent implements OnInit {
  palabras: string[] = [
    'ANGULAR',
    'TYPESCRIPT',
    'JAVASCRIPT',
    'DESARROLLO',
    'PROGRAMACION',
  ];
  palabraActual: string = '';
  letrasAdivinadas: Set<string> = new Set();
  intentosRestantes: number = 6;
  mensaje: string = '';
  letras: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  imagenActual: string = '/assets/games/AHORCADO0.png';
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  usuario: any;
  pedido: any;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private firestore: Firestore,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUser2();
    await this.getPedido();
    this.iniciarJuego();
  }

  iniciarJuego() {
    this.palabraActual =
      this.palabras[Math.floor(Math.random() * this.palabras.length)];
    this.letrasAdivinadas.clear();
    this.intentosRestantes = 6;
    this.mensaje = '';
    this.actualizarImagen();
  }

  adivinarLetra(letra: string) {
    if (this.letrasAdivinadas.has(letra)) return;

    this.letrasAdivinadas.add(letra);

    if (!this.palabraActual.includes(letra)) {
      this.intentosRestantes--;
      this.actualizarImagen();

      if (this.intentosRestantes === 0) {
        this.notificationService
          .showError('Perdiste, regresando a la espera...', 'Juego terminado')
          .then(() => {
            this.router.navigate(['/cliente-espera-pedido']);
          });
      }
    } else if (this.palabraCompleta()) {
      this.aplicarDescuento();
    }
  }

  palabraCompleta(): boolean {
    return [...this.palabraActual].every((letra) =>
      this.letrasAdivinadas.has(letra)
    );
  }

  mostrarLetra(letra: string): string {
    return this.letrasAdivinadas.has(letra) ? letra : '_';
  }

  actualizarImagen() {
    this.imagenActual = `assets/games/AHORCADO${
      6 - this.intentosRestantes
    }.png`;
  }

  async getPedido() {
    try {
      const pedidosRef = collection(this.firestore, 'pedidos');
      const q = query(pedidosRef, where('uidUsuario', '==', this.usuario.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const pedidoDoc = querySnapshot.docs[0];
        this.pedido = pedidoDoc.data();
        this.pedido.id = pedidoDoc.id;
      } else {
        console.log('No se encontraron pedidos para este usuario.');
      }
    } catch (error) {
      console.error('Error al obtener el pedido:', error);
      this.errorHandler.vibrate();
    }
  }

  async aplicarDescuento() {
    if (!this.pedido || !this.pedido.Precio) {
      console.log('Pedido o precio no encontrado.');
      return;
    }

    const descuento = this.pedido.Precio * 0.1;
    const precioConDescuento = this.pedido.Precio - descuento;

    try {
      const pedidoDocRef = doc(this.firestore, 'pedidos', this.pedido.id);
      await updateDoc(pedidoDocRef, {
        Descuento: descuento,
        PrecioConDescuento: precioConDescuento,
      });

      this.notificationService
        .showSuccess2(
          'Descuento aplicado correctamente. Regresando a la espera...',
          '¡Ganaste!'
        )
        .then(() => {
          this.router.navigate(['/cliente-espera-pedido']);
        });
    } catch (error) {
      console.error('Error al aplicar el descuento en el pedido:', error);
      this.errorHandler.vibrate();
    }
  }
}
