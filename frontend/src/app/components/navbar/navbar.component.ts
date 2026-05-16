import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoggedIn()) {
      <div class="navbar animate-fade-in">
        <div class="spacer"></div>
        <!-- Navbar cleared per UI cleanup request -->
      </div>
    }
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      right: 0;
      left: 280px;
      height: 80px;
      padding: 0 3rem;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      z-index: 1000;
      pointer-events: none;
      transition: left 0.3s ease;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      pointer-events: auto; /* Re-enable clicks for the icon */
    }

    .notification-trigger {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .notification-trigger:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .bell-icon { font-size: 1.2rem; }

    .unread-dot-badge {
      position: absolute;
      top: 8px;
      right: 9px;
      width: 10px;
      height: 10px;
      background: #f43f5e;
      border-radius: 50%;
      border: 2px solid #0a0a0f;
      box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
    }

    @media (max-width: 1024px) {
      .navbar { left: 80px; }
    }

    @media (max-width: 768px) {
      .navbar { left: 0; }
    }
  `]
})
export class NavbarComponent {
  private notifService = inject(NotificationService);
  private authService = inject(AuthService);

  unreadCount = this.notifService.unreadCount;
  isLoggedIn = this.authService.isAuthenticated;
}
