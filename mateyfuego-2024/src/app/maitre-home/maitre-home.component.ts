import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface UsuarioListado {
  mesaAsignada: boolean;
  uid: string;
  fotourl: string;
  nombre: string;
  id?: string;
}

@Component({
  selector: 'app-maitre-home',
  templateUrl: './maitre-home.component.html',
  styleUrls: ['./maitre-home.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, IonicModule],
})
export class MaitreHomeComponent implements OnInit {
  listaDeEspera: UsuarioListado[] = [];

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.cargarListaEspera();
  }

  cargarListaEspera(): void {
    this.firestore
      .collection('lista-espera')
      .snapshotChanges()
      .subscribe((data) => {
        this.listaDeEspera = data.map((e) => {
          const clienteData = e.payload.doc.data() as UsuarioListado;
          return { ...clienteData, id: e.payload.doc.id };
        });
        console.log(this.listaDeEspera[0]);
      });
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/default-avatar.png';
    }
  }

  asignarMesa(usuario: UsuarioListado): void {
    if (usuario.id) {
      this.firestore
        .collection('lista-espera')
        .doc(usuario.id)
        .update({ mesaAsignada: true })
        .then(() => {
          console.log('Mesa asignada exitosamente');
        })
        .catch(error => {
          console.error('Error al asignar mesa:', error);
        });
    }
  }
}