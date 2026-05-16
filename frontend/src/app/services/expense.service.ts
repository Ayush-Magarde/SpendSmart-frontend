import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SummaryService } from './summary.service';
import { BudgetService } from './budget.service';
import { NotificationService } from './notification.service';

export interface Expense {
  id?: number;
  amount: number;
  category: string;
  description: string;
  date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly API_URL = 'http://localhost:8080/api/expenses';
  
  private expensesSignal = signal<Expense[]>([]);
  expenses = this.expensesSignal.asReadonly();

  private summaryService = inject(SummaryService);
  private budgetService = inject(BudgetService);
  private notifService = inject(NotificationService);

  constructor(private http: HttpClient) {}

  fetchExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.API_URL).pipe(
      tap(data => this.expensesSignal.set(data))
    );
  }

  addExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(this.API_URL, expense).pipe(
      tap(newExpense => {
        this.expensesSignal.update(prev => [newExpense, ...prev]);
        this.notifService.refreshNotifications(); // Instant refresh
        setTimeout(() => {
          this.summaryService.refreshSummary();
          this.budgetService.fetchBudgets().subscribe();
        }, 500);
      })
    );
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.expensesSignal.update(prev => prev.filter(e => e.id !== id));
        this.notifService.refreshNotifications(); // Instant refresh
        setTimeout(() => {
          this.summaryService.refreshSummary();
          this.budgetService.fetchBudgets().subscribe();
        }, 500);
      })
    );
  }
}
