import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<any>({
    totalUsers: 0,
    premiumUsers: 0,
    incomeCount: 0,
    expenseCount: 0,
    totalInflow: 0,
    totalOutflow: 0
  });
  
  loading = signal(true);
  error = signal('');

  private readonly API_BASE = 'http://localhost:8080/api';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchStats();
  }

  fetchStats() {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      totalUsers: this.http.get<number>(`${this.API_BASE}/user/admin/users/count`),
      premiumUsers: this.http.get<number>(`${this.API_BASE}/user/admin/users/premium/count`),
      incomeCount: this.http.get<number>(`${this.API_BASE}/incomes/admin/count`),
      expenseCount: this.http.get<number>(`${this.API_BASE}/expenses/admin/count`),
      allIncomes: this.http.get<any[]>(`${this.API_BASE}/incomes/admin/all`),
      allExpenses: this.http.get<any[]>(`${this.API_BASE}/expenses/admin/all`)
    }).subscribe({
      next: (res) => {
        const totalInflow = res.allIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalOutflow = res.allExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        
        this.stats.set({
          ...res,
          totalInflow,
          totalOutflow
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch admin stats', err);
        this.error.set('Failed to load system statistics. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
