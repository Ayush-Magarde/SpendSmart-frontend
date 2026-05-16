import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { BudgetService, Budget } from '../../services/budget.service';
import { CategoryService, Category } from '../../services/category.service';
import { ExpenseService } from '../../services/expense.service';
import { NotificationService } from '../../services/notification.service';
import { validateAmount } from '../../utils/validators';

interface BudgetView {
  budgetId?: number;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'OVER';
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css'
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private expenseService = inject(ExpenseService);
  private notifService = inject(NotificationService);

  // State
  loading = signal(false);
  error = signal('');

  // UI State for "Set Budget"
  selectedCategoryId = '';
  budgetAmount = '';
  editingBudgetId: number | null = null;
  isSaving = signal(false);
  showForm = signal(false);

  // Raw Signals
  categories = this.categoryService.categories;
  budgets = this.budgetService.budgets;
  expenses = this.expenseService.expenses;

  // Computed data for the UI
  budgetItems = computed(() => {
    const allExpenseCats = this.categories().filter(c => c.type === 'EXPENSE');
    const budgetsList = this.budgets();

    // Check for duplicates
    const counts = new Map<string, number>();
    budgetsList.forEach(b => counts.set(b.category, (counts.get(b.category) || 0) + 1));
    counts.forEach((count, cat) => {
      if (count > 1) console.warn(`[Budget] Found ${count} duplicate budgets for category: ${cat}`);
    });

    const budgetMap = new Map(budgetsList.map(b => [b.category, b]));

    // Group expenses by category name
    const expenseMap = new Map<string, number>();
    this.expenses().forEach(e => {
      expenseMap.set(e.category, (expenseMap.get(e.category) || 0) + e.amount);
    });

    // Filter categories to show: Default ones OR ones that already have a budget set
    const visibleCats = allExpenseCats.filter(cat => {
      const hasBudget = budgetMap.has(cat.name);
      return cat.isDefault || hasBudget;
    });

    return visibleCats.map(cat => {
      const b = budgetMap.get(cat.name);
      const limit = (b?.amount || 0) as number;
      const spent = expenseMap.get(cat.name) || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status: 'SAFE' | 'WARNING' | 'OVER' = 'SAFE';
      if (limit > 0) {
        if (percentage >= 100) status = 'OVER';
        else if (percentage >= 70) status = 'WARNING';
      }

      return {
        budgetId: b?.id,
        category: cat,
        limit,
        spent,
        remaining,
        percentage,
        status
      } as BudgetView;
    }).sort((a, b) => b.percentage - a.percentage);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.categoryService.getAllCategories().subscribe();
    this.budgetService.fetchBudgets().subscribe();
    this.expenseService.fetchExpenses().subscribe({
      complete: () => this.loading.set(false),
      error: () => {
        this.error.set('Failed to load budget data');
        this.loading.set(false);
      }
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    this.selectedCategoryId = '';
    this.budgetAmount = '';
    this.editingBudgetId = null;
  }

  saveBudget() {
    this.error.set('');

    if (!this.selectedCategoryId) {
      this.error.set('Please select a category');
      return;
    }

    const amountErr = validateAmount(this.budgetAmount);
    if (amountErr) {
      this.error.set(amountErr);
      return;
    }

    const category = this.categories().find(c => c.id === parseInt(this.selectedCategoryId));
    if (!category) return;

    this.isSaving.set(true);
    this.error.set('');

    this.budgetService.saveBudget(
      category.name,
      parseFloat(String(this.budgetAmount).trim()),
      this.editingBudgetId || undefined
    ).subscribe({
      next: () => {
        this.notifService.success('Budget Saved', `Limit set for ${category.name}`);
        this.isSaving.set(false);
        this.showForm.set(false);
        this.selectedCategoryId = '';
        this.budgetAmount = '';
        this.editingBudgetId = null;
        this.loadData(); // Refresh all data
      },
      error: (err) => {
        console.error('Budget save failed', err);
        this.error.set('Failed to save budget. Please try again.');
        this.isSaving.set(false);
      }
    });
  }

  deleteBudget(item: BudgetView) {
    if (!item.budgetId) {
      console.warn('No budget ID found for category:', item.category.name);
      return;
    }

    this.notifService.confirm(
      'Remove Budget',
      `Are you sure you want to stop tracking the budget for ${item.category.name}?`,
      () => {
        this.budgetService.deleteBudget(item.budgetId!).subscribe({
          next: () => {
            this.notifService.success('Budget Removed', `Stopped tracking ${item.category.name}`);
            this.loadData();
          },
          error: (err) => {
            console.error('[Budget] Delete failed:', err);
            this.error.set('Failed to delete budget: ' + (err.error?.message || 'Server error'));
          }
        });
      }
    );
  }

  openEdit(item: BudgetView) {
    this.showForm.set(true);
    this.selectedCategoryId = item.category.id!.toString();
    this.budgetAmount = item.limit.toString();
    this.editingBudgetId = item.budgetId || null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
