import { Component, OnInit, AfterViewInit, inject, signal, computed, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SummaryService, SummaryData } from '../../services/summary.service';
import { ExpenseService } from '../../services/expense.service';
import { IncomeService } from '../../services/income.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-breakdown',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './breakdown.component.html',
  styleUrl: './breakdown.component.css'
})
export class BreakdownComponent implements OnInit, AfterViewInit, OnDestroy {
  private summaryService = inject(SummaryService);
  private expenseService = inject(ExpenseService);
  private incomeService = inject(IncomeService);

  @ViewChild('chartCanvas', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  
  // Lifecycle Flags
  viewReady = false;
  dataReady = false;

  // State
  mode = signal<'EXPENSE' | 'INCOME'>('EXPENSE');
  loading = signal(false);

  // Raw data from services (Signals)
  private expenses = this.expenseService.expenses;
  private incomes = this.incomeService.incomes;
  private summary = this.summaryService.summary;

  // Current dataset for rendering
  chartData: { name: string, value: number, percentage: number }[] = [];

  constructor() {
    console.log('[Breakdown] Component Constructor');
  }

  ngOnInit() {
    this.fetchInitialData();
  }

  ngAfterViewInit() {
    console.log('[Breakdown] View Ready. CanvasRef:', this.chartRef);
    this.viewReady = true;
    this.tryRenderChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  fetchInitialData() {
    this.loading.set(true);
    
    // Refresh services
    this.expenseService.fetchExpenses().subscribe();
    this.incomeService.fetchIncomes().subscribe();
    this.summaryService.refreshSummary();

    // Allow time for signals to propagate
    setTimeout(() => {
      this.loading.set(false);
      this.processData();
      this.dataReady = true;
      console.log('[Breakdown] Data Ready. Count:', this.chartData.length);
      this.tryRenderChart();
    }, 800);
  }

  private processData() {
    const isExpense = this.mode() === 'EXPENSE';
    const rawData = isExpense ? this.expenses() : this.incomes();
    
    if (rawData.length === 0) {
      this.chartData = [];
      return;
    }

    const grouped: Record<string, number> = {};
    let total = 0;

    rawData.forEach(item => {
      grouped[item.category] = (grouped[item.category] || 0) + item.amount;
      total += item.amount;
    });

    this.chartData = Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  setMode(mode: 'EXPENSE' | 'INCOME') {
    this.mode.set(mode);
    this.processData();
    this.tryRenderChart();
  }

  tryRenderChart() {
    console.log('[Breakdown] tryRenderChart check:', { viewReady: this.viewReady, dataReady: this.dataReady, hasData: this.chartData.length > 0 });
    
    if (!this.viewReady || !this.dataReady) return;
    
    if (this.chartData.length === 0) {
      if (this.chart) this.chart.destroy();
      return;
    }

    // Execution with slight delay for DOM stability
    setTimeout(() => {
      this.renderChart();
    }, 0);
  }

  renderChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (!this.chartRef || !this.chartRef.nativeElement) {
      console.error('[Breakdown] Canvas element not found!');
      return;
    }

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    console.log('[Breakdown] Initializing ChartJS Instance');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.chartData.map(c => c.name),
        datasets: [{
          data: this.chartData.map(c => c.value),
          backgroundColor: [
            '#9333ea', '#ef4444', '#10b981', '#f59e0b', 
            '#3b82f6', '#ec4899', '#6366f1', '#14b8a6'
          ],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        layout: {
          padding: 20
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        cutout: '80%',
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });
  }

  // Helpers for template
  get totalValue(): number {
    const isEx = this.mode() === 'EXPENSE';
    return isEx ? this.summary()?.totalExpense || 0 : this.summary()?.totalIncome || 0;
  }

  get highestCategory() {
    return this.chartData[0] || null;
  }

  get averageAmount(): number {
    if (this.chartData.length === 0) return 0;
    return this.totalValue / this.chartData.length;
  }
}
