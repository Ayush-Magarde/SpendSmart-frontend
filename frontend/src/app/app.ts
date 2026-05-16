import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NotificationService, ToastNotification } from './services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  template: `
    <div class="bg-gradient"></div>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>

    <!-- Global Toast Notifications Container -->
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div class="toast-popup" [class]="toast.type.toLowerCase()" (click)="removeToast(toast.id)">
          <div class="toast-icon">{{ getToastEmoji(toast.type) }}</div>
          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
        </div>
      }
    </div>

    <!-- Global Confirmation Modal -->
    @if (confirmation()) {
      <div class="modal-overlay" (click)="onCancelConfirm()">
        <div class="confirm-modal" (click)="$event.stopPropagation()">
          <div class="confirm-icon">❓</div>
          <h3>{{ confirmation()?.title }}</h3>
          <p>{{ confirmation()?.message }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="onCancelConfirm()">Cancel</button>
            <button class="btn-confirm" (click)="onConfirm()">Confirm</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './app.css',
})
export class App {
  private notifService = inject(NotificationService);
  
  toasts = this.notifService.toasts;
  confirmation = this.notifService.confirmation;

  getToastEmoji(type: string): string {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return 'ℹ️';
    }
  }

  removeToast(id: string) {
    this.notifService.removeToast(id);
  }

  onConfirm() {
    const config = this.confirmation();
    if (config) {
      config.onConfirm();
      this.notifService.cancelConfirmation();
    }
  }

  onCancelConfirm() {
    this.notifService.cancelConfirmation();
  }
}
