import { environment } from '../../environments/environment';
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Budget {
  id?: number;
  name: string;
  amount: number;
  spent: number;
  category: string;
  alertThreshold: number;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiBaseUrl}/api/budgets`;
  
  private budgetsSignal = signal<Budget[]>([]);
  budgets = this.budgetsSignal.asReadonly();

  fetchBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.API_URL).pipe(
      tap(data => this.budgetsSignal.set(data))
    );
  }

  saveBudget(categoryName: string, amount: number, id?: number): Observable<Budget> {
    const payload = {
      name: categoryName,
      amount: Number(amount),
      category: categoryName,
      alertThreshold: Number(amount) * 0.8
    };
    
    if (id) {
      return this.http.put<Budget>(`${this.API_URL}/${id}`, payload);
    }
    return this.http.post<Budget>(this.API_URL, payload);
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { responseType: 'text' });
  }
}


