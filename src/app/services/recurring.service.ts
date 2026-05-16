import { environment } from '../../environments/environment';
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface RecurringRule {
  id?: number;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RecurringService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/recurring`;
  private http = inject(HttpClient);
  
  // State for recurring rules
  private rulesSignal = signal<RecurringRule[]>([]);
  rules = this.rulesSignal.asReadonly();

  fetchRules(): Observable<RecurringRule[]> {
    return this.http.get<RecurringRule[]>(this.API_URL).pipe(
      tap(data => this.rulesSignal.set(data))
    );
  }

  createRule(rule: RecurringRule): Observable<RecurringRule> {
    return this.http.post<RecurringRule>(this.API_URL, rule).pipe(
      tap(newRule => this.rulesSignal.update(prev => [newRule, ...prev]))
    );
  }

  deleteRule(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { responseType: 'text' }).pipe(
      tap(() => this.rulesSignal.update(prev => prev.filter(r => r.id !== id)))
    );
  }
}


