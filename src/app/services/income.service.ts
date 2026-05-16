import { environment } from '../../environments/environment';
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SummaryService } from './summary.service';
import { NotificationService } from './notification.service';

export interface Income {
  id?: number;
  amount: number;
  category: string;
  description: string;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/incomes`;
  
  // State for incomes
  private incomesSignal = signal<Income[]>([]);
  incomes = this.incomesSignal.asReadonly();

  private summaryService = inject(SummaryService);
  private notifService = inject(NotificationService);

  constructor(private http: HttpClient) {}

  fetchIncomes(): Observable<Income[]> {
    return this.http.get<Income[]>(this.API_URL).pipe(
      tap(data => this.incomesSignal.set(data))
    );
  }

  addIncome(income: Income): Observable<Income> {
    return this.http.post<Income>(this.API_URL, income).pipe(
      tap(newIncome => {
        this.incomesSignal.update(prev => [newIncome, ...prev]);
        this.notifService.refreshNotifications(); // Instant refresh
        setTimeout(() => {
          this.summaryService.refreshSummary();
        }, 500);
      })
    );
  }

  deleteIncome(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.incomesSignal.update(prev => prev.filter(i => i.id !== id));
        this.notifService.refreshNotifications(); // Instant refresh
        setTimeout(() => {
          this.summaryService.refreshSummary();
        }, 500);
      })
    );
  }
}


