import { Component, inject, computed, OnInit, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SummaryService } from '../../services/summary.service';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { BudgetService } from '../../services/budget.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

import { NotificationService } from '../../services/notification.service';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarComponent, RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('spendingChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  private authService = inject(AuthService);
  private summaryService = inject(SummaryService);
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);
  private budgetService = inject(BudgetService);
  public notificationService = inject(NotificationService);
  private paymentService = inject(PaymentService);

  user = this.authService.currentUser;
  isPremium = this.authService.isPremium;
  summary = this.summaryService.summary;
  loading = this.summaryService.loading;
  error = this.summaryService.error;

  onUpgrade() {
    this.paymentService.payForPremium();
  }

  // 1. Chart & Legend Data
  chartData = computed(() => {
    const breakdown = this.summary()?.categoryBreakdown || {};
    const labels = Object.keys(breakdown);
    const data = Object.values(breakdown);
    const total = data.reduce((a, b) => a + b, 0);
    
    const colors = [
      '#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', 
      '#ef4444', '#06b6d4', '#84cc16', '#6366f1'
    ];

    return {
      labels,
      datasets: data,
      total,
      legend: labels.map((label, i) => ({
        label,
        amount: breakdown[label],
        percent: total > 0 ? (breakdown[label] / total) * 100 : 0,
        color: colors[i % colors.length]
      })).sort((a, b) => b.amount - a.amount)
    };
  });

  // 2. Recent Transactions
  recentTransactions = computed(() => {
    const incomes = this.incomeService.incomes().map(i => ({ ...i, type: 'income' as const }));
    const expenses = this.expenseService.expenses().map(e => ({ ...e, type: 'expense' as const }));
    
    return [...incomes, ...expenses]
      .sort((a, b) => (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime()) || (b.id || 0) - (a.id || 0))
      .slice(0, 5);
  });

  // 3. Budget Status
  budgetStatus = computed(() => {
    const expenses = this.expenseService.expenses();
    const expenseMap = new Map<string, number>();
    
    // Sum up expenses per category
    expenses.forEach(e => {
      expenseMap.set(e.category, (expenseMap.get(e.category) || 0) + e.amount);
    });

    return this.budgetService.budgets()
      .map(b => {
        // Use real-time expense sum instead of potentially stale b.spent
        const actualSpent = expenseMap.get(b.category) || 0;
        const percentage = b.amount > 0 ? (actualSpent / b.amount) * 100 : 0;
        return { ...b, spent: actualSpent, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);
  });

  // 4. Real Insights (Computed from existing data)
  lastIncome = computed(() => {
    const incomes = this.incomeService.incomes();
    return incomes.length > 0 ? incomes[0] : null;
  });

  topCategory = computed(() => {
    const legend = this.chartData().legend;
    return legend.length > 0 ? legend[0] : null;
  });

  exceededBudgetsCount = computed(() => {
    const expenses = this.expenseService.expenses();
    const expenseMap = new Map<string, number>();
    expenses.forEach(e => expenseMap.set(e.category, (expenseMap.get(e.category) || 0) + e.amount));

    return this.budgetService.budgets().filter(b => {
      const actualSpent = expenseMap.get(b.category) || 0;
      return actualSpent > b.amount;
    }).length;
  });

  constructor() {
    // Effect to update chart when data changes
    effect(() => {
      const data = this.chartData();
      if (this.chart && data.datasets.length > 0) {
        this.chart.data.labels = data.labels;
        this.chart.data.datasets[0].data = data.datasets;
        this.chart.update();
      }
    });
  }

  ngOnInit() {
    this.incomeService.fetchIncomes().subscribe();
    this.expenseService.fetchExpenses().subscribe();
    this.budgetService.fetchBudgets().subscribe();
    this.summaryService.refreshSummary();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  private initChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.chartData();
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.datasets,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        layout: {
          padding: 20
        },
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 12,
            cornerRadius: 8,
            displayColors: true
          }
        },
        maintainAspectRatio: false
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
