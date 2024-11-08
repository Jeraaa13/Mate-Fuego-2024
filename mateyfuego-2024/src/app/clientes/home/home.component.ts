import { Component } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrService } from '../../services/qr.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ZXingScannerModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  isScannerVisible = false;

  constructor(private qrService: QrService, private router: Router) {}

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  onScanSuccess(resultado: string) {
    console.log('Resultado QR => ', resultado);

    if (resultado === 'encuesta:12345') {
      this.router.navigate(['/EncuestaClientes']);
    } else {
      this.qrService.onScanSuccess(resultado);
    }

    this.toggleScanner();
  }
}
