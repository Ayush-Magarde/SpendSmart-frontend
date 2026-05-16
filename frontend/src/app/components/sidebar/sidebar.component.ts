import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { PaymentService } from '../../services/payment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar glass">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#9333ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>SpendSmart</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="icon">📊</span>
          <span class="label">Dashboard</span>
        </a>
        <a routerLink="/income" routerLinkActive="active" class="nav-item">
          <span class="icon">💰</span>
          <span class="label">Income</span>
        </a>
        <a routerLink="/expenses" routerLinkActive="active" class="nav-item">
          <span class="icon">💸</span>
          <span class="label">Expenses</span>
        </a>
        <a routerLink="/budget" routerLinkActive="active" class="nav-item">
          <span class="icon">🎯</span>
          <span class="label">Budgets</span>
        </a>
        <a routerLink="/recurring" routerLinkActive="active" class="nav-item">
          <span class="icon">🔁</span>
          <span class="label">Recurring</span>
        </a>
        <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
          <span class="icon">📜</span>
          <span class="label">Transactions</span>
        </a>
        <a routerLink="/breakdown" routerLinkActive="active" class="nav-item">
          <span class="icon">📈</span>
          <span class="label">Breakdown</span>
        </a>
        <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
          <span class="icon">🔔</span>
          <span class="label" style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            Notifications
            @if (unreadCount() > 0) {
              <span class="sidebar-badge">{{ unreadCount() }}</span>
            }
          </span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="premium-cta" [class.premium-active]="isPremium()" (click)="onUpgrade()">
          <div class="cta-icon">{{ isPremium() ? '💎' : '✨' }}</div>
          <div class="cta-text">
            <span class="cta-title">{{ isPremium() ? 'Premium Active' : 'Upgrade to Premium' }}</span>
            <span class="cta-sub">{{ isPremium() ? 'All features unlocked' : 'Unlock advanced insights' }}</span>
          </div>
        </div>
        <div class="user-profile">
          <div class="avatar">{{ user()?.name?.[0] || 'U' }}</div>
          <div class="user-info">
            <span class="name">{{ user()?.name || 'User' }}</span>
            <span class="email">{{ user()?.email || 'user@example.com' }}</span>
          </div>
          <button (click)="logout()" class="btn-icon-logout" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 2rem 1.25rem;
      background: rgba(10, 10, 15, 0.95);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3rem;
      padding: 0 0.5rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.03);
      color: white;
    }

    .nav-item.active {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
      box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.2);
    }

    .icon { font-size: 1.25rem; }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .sidebar-badge {
      background: #f43f5e;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
    }

    .premium-cta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.05));
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .premium-cta:hover {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(109, 40, 217, 0.1));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
    }

    .premium-cta.premium-active {
      background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(202, 138, 4, 0.05));
      border: 1px solid rgba(234, 179, 8, 0.4);
      cursor: default;
      box-shadow: 0 0 15px rgba(234, 179, 8, 0.1);
    }
    
    .premium-cta.premium-active:hover {
      transform: none;
    }

    .premium-active .cta-title { color: #fde047; }
    .premium-active .cta-sub { color: #eab308; }

    .cta-icon { font-size: 1.25rem; }
    .cta-text { display: flex; flex-direction: column; }
    .cta-title { font-size: 0.85rem; font-weight: 700; color: #e9d5ff; }
    .cta-sub { font-size: 0.7rem; color: #a78bfa; }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-info .name {
      font-size: 0.9rem;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-info .email {
      font-size: 0.7rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-icon-logout {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon-logout:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    @media (max-width: 1024px) {
      .sidebar { width: 80px; padding: 2rem 0.75rem; }
      .logo span, .label, .user-info, .notification-trigger, .cta-text { display: none; }
      .nav-item, .user-profile, .premium-cta { justify-content: center; padding: 0.85rem; }
      .user-profile { background: transparent; border: none; }
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private paymentService = inject(PaymentService);
  
  user = this.authService.currentUser;
  unreadCount = this.notifService.unreadCount;
  isPremium = this.authService.isPremium;

  onUpgrade() {
    this.paymentService.payForPremium();
  }

  logout() {
    this.authService.logout();
  }
}
