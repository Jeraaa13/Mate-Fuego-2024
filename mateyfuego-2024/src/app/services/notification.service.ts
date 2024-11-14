import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showSuccess(message: string, title: string, config?: any) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      timer: config?.timeOut || 4000,
      timerProgressBar: true,
      position: 'center',
      heightAuto: false,
      ...config,
    });
  }

  showError(message: string, title: string, config?: any) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      timer: config?.timeOut || 4000,
      timerProgressBar: true,
      position: 'center',
      heightAuto: false,
      ...config,
    });
  }

  showInfo(message: string, title: string, config?: any) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'info',
      confirmButtonText: 'Aceptar',
      timer: config?.timeOut || 4000,
      timerProgressBar: true,
      position: 'center',
      heightAuto: false,
      ...config,
    });
  }

  showWarning(message: string, title: string, config?: any) {
    Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'Aceptar',
      timer: config?.timeOut || 4000,
      timerProgressBar: true,
      position: 'center',
      heightAuto: false,
      ...config,
    });
  }
  async showConfirm(message: string, title: string, config?: any) {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      heightAuto: false,
      ...config,
    });
  }
  async showConfirm2(message: string, title: string, config?: any) {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      heightAuto: false,
      ...config,
    });
  }
}
