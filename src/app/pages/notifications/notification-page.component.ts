import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="dashboard-layout">
      <app-sidebar></app-sidebar>
      
      <main class="dashboard-main content-area animate-fade-in">
        <div class="page-header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with your financial alerts</p>
          </div>
          
          <div class="filter-group glass">
            <button class="filter-btn" [class.active]="filter() === 'ALL'" (click)="setFilter('ALL')">All</button>
            <button class="filter-btn" [class.active]="filter() === 'BUDGET'" (click)="setFilter('BUDGET')">Budget</button>
            <button class="filter-btn" [class.active]="filter() === 'SYSTEM'" (click)="setFilter('SYSTEM')">System</button>
          </div>
        </div>

        <div class="notifications-container">
          @if (filteredNotifications().length === 0) {
            <div class="empty-state glass">
              <span class="emoji">🎉</span>
              <h3>You're all caught up!</h3>
              <p>No notifications found for this filter.</p>
            </div>
          } @else {
            <div class="notif-grid">
              @for (n of filteredNotifications(); track n.id) {
                <div class="notif-card glass" [class.unread]="!n.isRead" (click)="markAsRead(n)">
                  <div class="type-indicator" [style.background-color]="getTypeColor(n.type)"></div>
                  <div class="notif-content">
                    <div class="notif-top">
                      <span class="category-tag" [style.border-color]="getCategoryColor(n.category)" [style.color]="getCategoryColor(n.category)">
                        {{ n.category }}
                      </span>
                      <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                    </div>
                    <h3 class="notif-title">{{ n.title }}</h3>
                    <p class="notif-message">{{ n.message }}</p>
                  </div>
                  @if (!n.isRead) {
                    <div class="unread-dot"></div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      display: flex;
      background: var(--bg-dark);
    }

    .content-area {
      margin-left: 280px;
      flex: 1;
      padding: 3rem 4rem;
      max-width: 1400px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;
      padding-top: 2rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 1rem;
    }

    .filter-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.5rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      color: var(--text-main);
      background: rgba(255,255,255,0.05);
    }

    .filter-btn.active {
      background: var(--primary);
      color: white;
    }

    .empty-state {
      padding: 5rem 2rem;
      text-align: center;
      border-radius: 1.5rem;
    }

    .empty-state .emoji {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--text-muted);
    }

    .notif-grid {
      display: grid;
      gap: 1.5rem;
    }

    .notif-card {
      padding: 1.5rem;
      border-radius: 1.25rem;
      display: flex;
      gap: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      border: 1px solid var(--border);
    }

    .notif-card:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.15);
    }

    .notif-card.unread {
      background: rgba(147, 51, 234, 0.05);
      border-color: rgba(147, 51, 234, 0.2);
    }

    .type-indicator {
      width: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .notif-content {
      flex: 1;
    }

    .notif-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .category-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .notif-time {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .notif-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .notif-message {
      color: var(--text-muted);
      line-height: 1.5;
    }

    .unread-dot {
      width: 12px;
      height: 12px;
      background: var(--primary);
      border-radius: 50%;
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      box-shadow: 0 0 10px var(--primary);
    }

    @media (max-width: 1024px) {
      .content-area { margin-left: 80px; padding: 2rem; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
    }
    @media (max-width: 768px) {
      .content-area { margin-left: 0; padding: 1.5rem; }
    }
  `]
})
export class NotificationPageComponent implements OnInit {
  private notifService = inject(NotificationService);
  
  filter = signal<string>('ALL');
  
  filteredNotifications = computed(() => {
    const all = this.notifService.notifications();
    const currentFilter = this.filter();
    if (currentFilter === 'ALL') return all;
    return all.filter(n => n.category === currentFilter);
  });

  ngOnInit() {
    // Explicitly fetch to avoid waiting for polling
    this.notifService.fetchNotifications().subscribe({
      next: () => {
        // Clear the unread count when user opens the page and data is loaded
        this.notifService.markAllAsRead().subscribe();
      }
    });
  }

  setFilter(f: string) {
    this.filter.set(f);
  }

  markAsRead(n: Notification) {
    if (!n.isRead) {
      this.notifService.markAsRead(n.id).subscribe();
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'INFO': return '#3b82f6';
      case 'SUCCESS': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getCategoryColor(cat: string): string {
    switch (cat) {
      case 'BUDGET': return '#a855f7';
      case 'EXPENSE': return '#ef4444';
      case 'PAYMENT': return '#22c55e';
      case 'SYSTEM': return '#6b7280';
      default: return '#6b7280';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
}
