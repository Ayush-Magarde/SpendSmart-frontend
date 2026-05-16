import { environment } from '../../environments/environment';
import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, startWith, switchMap, tap, catchError, of, forkJoin } from 'rxjs';
import { AuthService } from './auth.service';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type NotificationCategory = 'BUDGET' | 'SYSTEM';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiBaseUrl}/api/notifications`;

  // Signals for state management
  private notificationsSignal = signal<Notification[]>([]);
  notifications = this.notificationsSignal.asReadonly();
  
  unreadCount = signal<number>(0);
  
  // Signals for active toasts (array allows for better tracking)
  toasts = signal<ToastNotification[]>([]);
  
  // Signal for the current active confirmation dialog
  confirmation = signal<{title: string, message: string, onConfirm: () => void} | null>(null);
  
  private lastCount = 0;

  private authService = inject(AuthService);

  constructor() {
    // Start polling every 5 seconds for a snappier experience
    interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.authService.getToken()) return of([]);
          return this.fetchNotifications().pipe(
            catchError(err => {
              console.error('Notification polling error:', err);
              return of([]);
            })
          );
        })
      )
      .subscribe();

    // Effect to trigger toast when unread count increases
    effect(() => {
      const count = this.unreadCount();
      const notifs = this.notificationsSignal();
      
      // Only show a toast if the count actually increased and we have new notifications
      if (count > this.lastCount && notifs.length > 0) {
        const latest = notifs[0];
        if (!latest.isRead) {
          // Check if we already have a toast with this exact message to avoid duplicates
          const alreadyShowing = this.toasts().some(t => t.message === latest.message);
          if (!alreadyShowing) {
            this.showToast(latest.title, latest.message, latest.type);
          }
        }
      }
      this.lastCount = count;
    }, { allowSignalWrites: true });
  }

  showToast(title: string, message: string, type: string = 'INFO') {
    // Prevent exact duplicate messages from stacking
    if (this.toasts().some(t => t.message === message)) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, message, type };
    
    // Add to active toasts
    this.toasts.update(current => [...current, newToast]);

    // Remove after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  success(title: string, message: string) {
    this.showToast(title, message, 'SUCCESS');
  }

  error(title: string, message: string) {
    this.showToast(title, message, 'ERROR');
  }

  warn(title: string, message: string) {
    this.showToast(title, message, 'WARNING');
  }

  confirm(title: string, message: string, onConfirm: () => void) {
    this.confirmation.set({ title, message, onConfirm });
  }

  cancelConfirmation() {
    this.confirmation.set(null);
  }

  refreshNotifications() {
    this.fetchNotifications().subscribe();
  }

  fetchNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.API_URL).pipe(
      tap(data => {
        // Sort by latest
        const sorted = data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.notificationsSignal.set(sorted);
        this.unreadCount.set(sorted.filter(n => !n.isRead).length);
      })
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/read`, {}, { responseType: 'text' }).pipe(
      tap(() => {
        // Update local state instantly
        this.notificationsSignal.update(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<any> {
    const unreadIds = this.notificationsSignal().filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return of(null);

    // Optimistically update UI immediately
    this.notificationsSignal.update(prev => prev.map(n => ({ ...n, isRead: true })));
    this.unreadCount.set(0);

    // Fire off all read requests
    const requests = unreadIds.map(id => this.http.patch(`${this.API_URL}/${id}/read`, {}, { responseType: 'text' }));
    return forkJoin(requests).pipe(
      catchError(err => {
        console.error('Failed to mark all as read:', err);
        // Silently fail for UX, or reload data
        return of(null);
      })
    );
  }

  createNotification(payload: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(this.API_URL, payload).pipe(
      tap(() => this.fetchNotifications().subscribe())
    );
  }
}


