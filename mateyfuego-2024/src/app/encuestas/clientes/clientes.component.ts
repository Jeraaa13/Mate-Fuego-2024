import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { lastValueFrom } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
interface EncuestaCliente {
  satisfaccionGeneral: number;
  nombre: string;
  recomendaria: boolean;
  serviciosUtilizados: string[];
  tipoCliente: string;
  comentarios: string;
  fotosUrls: string[];
  fechaCreacion: Date;
}

@Component({
  selector: 'app-encuesta-cliente',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  standalone:true,
  imports:[CommonModule,IonicModule,FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EncuestaClienteComponent implements OnInit {
  encuesta: EncuestaCliente = {
    satisfaccionGeneral: 50,
    nombre: '',
    recomendaria: false,
    serviciosUtilizados: [],
    tipoCliente: '',
    comentarios: '',
    fotosUrls: [],
    fechaCreacion: new Date(),
  };
  loading = false;
  servicioRestaurante: boolean = false;
  servicioBar: boolean = false;
  servicioDelivery: boolean = false;

  constructor(
    private storage: AngularFireStorage,
    private firestore: Firestore,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {}

  ngOnInit() {}

  async uploadPhotos(event: any) {
    try {
      const files = event.target.files;
      if (!files) return;
      if (this.encuesta.fotosUrls.length + files.length > 3) {
        throw new Error('Solo puedes cargar hasta 3 fotos.');
      }
      this.loading = true;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `encuestas_clientes/foto_${new Date().getTime()}_${file.name}`;
        const fileRef = this.storage.ref(filePath);
        await fileRef.put(file);
        const photoUrl = await lastValueFrom(fileRef.getDownloadURL());
        this.encuesta.fotosUrls.push(photoUrl);
      }
    } catch (error) {
      console.error('Error al subir las fotos:', error);
      this.errorHandler.vibrate();
    } finally {
      this.loading = false;
    }
  }

  removePhoto(index: number) {
    this.encuesta.fotosUrls.splice(index, 1);
  }

  async submitEncuesta(event: Event) {
    event.preventDefault();
    try {
      if (!this.validarEncuesta()) {
        this.notificationService.showError(
          'Por favor complete todos los campos requeridos',
          'Campos Incompletos'
        );
        return;
      }
      this.loading = true;
      const encuestaToSave = { ...this.encuesta, fechaCreacion: new Date() };
      const encuestasCollection = collection(this.firestore, 'encuestas_clientes');
      await addDoc(encuestasCollection, encuestaToSave);
      this.notificationService.showSuccess(
        'Gracias por su encuesta',
        'Encuesta Enviada'
      );
      this.resetForm();
      this.router.navigate(['cliente-espera-pedido']);
    } catch (error) {
      console.error('Error al enviar la encuesta:', error);
      this.notificationService.showError(
        'Hubo un problema al enviar la encuesta. Intente nuevamente.',
        'Error al Enviar Encuesta'
      );
      this.errorHandler.vibrate();
    } finally {
      this.loading = false;
    }
  }

  private validarEncuesta(): boolean {
    return (
      this.encuesta.satisfaccionGeneral >= 0 &&
      this.encuesta.satisfaccionGeneral <= 100 &&
      this.encuesta.nombre.trim() !== '' &&
      this.encuesta.tipoCliente !== ''
    );
  }

  resetForm() {
    this.encuesta = {
      satisfaccionGeneral: 50,
      nombre: '',
      recomendaria: false,
      serviciosUtilizados: [],
      tipoCliente: '',
      comentarios: '',
      fotosUrls: [],
      fechaCreacion: new Date(),
    };
    this.servicioRestaurante = false;
    this.servicioBar = false;
    this.servicioDelivery = false;
  }

  onCheckboxChange(event: any, item: string) {
    const isChecked = event.detail.checked;
    if (isChecked && !this.encuesta.serviciosUtilizados.includes(item)) {
      this.encuesta.serviciosUtilizados.push(item);
    } else {
      this.encuesta.serviciosUtilizados =
        this.encuesta.serviciosUtilizados.filter((servicio) => servicio !== item);
    }
  }
}
