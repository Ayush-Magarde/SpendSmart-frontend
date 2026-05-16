import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, Subject, startWith, switchMap, catchError, of } from 'rxjs';

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
  monthlyComparison: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SummaryService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/summary';
  
  // Trigger for refreshing the summary
  private refreshTrigger = new Subject<void>();
  
  // State for summary
  private summarySignal = signal<SummaryData | null>(null);
  summary = this.summarySignal.asReadonly();
  
  loading = signal(false);
  error = signal('');

  constructor() {
    // Automatically fetch/refresh when triggered
    this.refreshTrigger.pipe(
      startWith(null),
      tap(() => this.loading.set(true)),
      switchMap(() => this.http.get<SummaryData>(this.API_URL).pipe(
        catchError(err => {
          console.error('Failed to fetch summary:', err);
          this.error.set('Failed to load financial summary');
          this.loading.set(false);
          return of(null);
        })
      ))
    ).subscribe((data) => {
      if (data) {
        this.summarySignal.set(data);
        this.loading.set(false);
        this.error.set('');
      }
    });
  }

  refreshSummary() {
    this.refreshTrigger.next();
  }
}
