import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  isPremium?: boolean;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly USER_URL = 'http://localhost:8080/api/user';
  
  // State using Signals
  private currentUserSignal = signal<AuthResponse | null>(null);
  
  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal());
  isPremium = computed(() => !!this.currentUserSignal()?.isPremium);
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
  }

  private loadToken() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.currentUserSignal.set({
        token,
        email: localStorage.getItem('user_email') || '',
        name: localStorage.getItem('user_name') || '',
        isPremium: localStorage.getItem('user_is_premium') === 'true',
        role: localStorage.getItem('user_role') || 'USER'
      });
      // Refresh profile data from server
      this.fetchProfile().subscribe();
    }
  }

  fetchProfile(): Observable<AuthResponse> {
    const email = localStorage.getItem('user_email') || '';
    // Headers will be handled by interceptor if we update it, 
    // but for now we'll pass it if needed or rely on token.
    // The backend UserController needs X-User-Email.
    return this.http.get<AuthResponse>(`${this.USER_URL}/profile`, {
      headers: { 'X-User-Email': email }
    }).pipe(
      tap(res => {
        const current = this.currentUserSignal();
        if (current) {
          this.handleAuthSuccess({ ...res, token: current.token });
        }
      })
    );
  }

  registerInit(data: any): Observable<string> {
    return this.http.post(`${this.API_URL}/register/init`, data, { responseType: 'text' });
  }

  registerVerify(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register/verify`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  handleOAuthSuccess(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const res = {
        token,
        email: payload.sub ?? '',
        name: payload.name || payload.sub || 'Google User',
        isPremium: false, // Will be updated by fetchProfile
        role: payload.role || 'USER' // Fetch role from decoded token just for oauth success
      };
      this.handleAuthSuccess(res);
      this.fetchProfile().subscribe();
      
      if (res.role === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch {
      this.handleAuthSuccess({ token, email: '', name: 'Google User', isPremium: false, role: 'USER' });
      this.router.navigate(['/dashboard']);
    }
  }

  private handleAuthSuccess(res: AuthResponse) {
    if (res.token) localStorage.setItem('auth_token', res.token);
    localStorage.setItem('user_email', res.email);
    localStorage.setItem('user_name', res.name);
    localStorage.setItem('user_is_premium', String(!!res.isPremium));
    if (res.role) localStorage.setItem('user_role', res.role);
    this.currentUserSignal.set(res);
  }

  updatePremiumStatus(status: boolean) {
    const current = this.currentUserSignal();
    if (current) {
      this.handleAuthSuccess({ ...current, isPremium: status });
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_premium');
    localStorage.removeItem('user_role');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
