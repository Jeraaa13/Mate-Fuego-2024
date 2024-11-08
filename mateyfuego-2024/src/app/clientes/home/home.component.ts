import { Component } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrService } from '../../services/qr.service';
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

  constructor(private qrService: QrService) {}

  toggleScanner() {
    this.isScannerVisible = !this.isScannerVisible;
  }

  onScanSuccess(resultado: string) {
    this.qrService.onScanSuccess(resultado);
  }
}
