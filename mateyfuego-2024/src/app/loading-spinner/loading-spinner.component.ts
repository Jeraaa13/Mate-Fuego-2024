// loading-spinner.component.ts
import { Component, Input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [IonSpinner, NgClass, NgIf],
  template: `
    <div class="spinner-container" [ngClass]="{ overlay: overlay }">
      <div class="spinner-content">
        <img
          [src]="logoUrl"
          alt="Company Logo"
          class="company-logo"
          *ngIf="logoUrl"
        />
        <ion-spinner [name]="spinnerType" [color]="color"> </ion-spinner>
        <p *ngIf="message" class="spinner-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        min-height: 100px;
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        z-index: 9999;
      }

      .spinner-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background-color: var(--ion-background-color);
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .company-logo {
        width: 80px;
        height: auto;
        margin-bottom: 1rem;
      }

      .spinner-message {
        color: var(--ion-text-color);
        margin: 0;
        text-align: center;
        font-weight: 500;
      }

      ion-spinner {
        transform: scale(1.5);
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() logoUrl?: string = 'assets/icon.png';
  @Input() overlay: boolean = true;
  @Input() spinnerType: string = 'circular';
  @Input() color: string = 'primary';
  @Input() message?: string;
}
