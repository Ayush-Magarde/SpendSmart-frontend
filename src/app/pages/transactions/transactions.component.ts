import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { IncomeService } from '../../services/income.service';
import { ExpenseService } from '../../services/expense.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';

interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent implements OnInit {
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);
  private categoryService = inject(CategoryService);
  private notifService = inject(NotificationService);

  loading = signal(false);
  deletingId = signal<string | null>(null);

  // Filter & Sort State
  selectedType = signal<'ALL' | 'income' | 'expense'>('ALL');
  selectedCategory = signal<string>('ALL');
  sortOrder = signal<'DESC' | 'ASC'>('DESC');

  // Categories for dropdown
  categories = this.categoryService.categories;

  filteredCategories = computed(() => {
    const type = this.selectedType();
    const all = this.categories();
    
    if (type === 'income') {
      return all.filter(c => c.type === 'INCOME');
    } else if (type === 'expense') {
      return all.filter(c => c.type === 'EXPENSE');
    }
    return all;
  });

  onTypeChange(newType: 'ALL' | 'income' | 'expense') {
    this.selectedType.set(newType);
    this.selectedCategory.set('ALL'); // Reset category to avoid invalid selection
  }

  // Filtered and Sorted Transactions
  transactions = computed(() => {
    const incomes: Transaction[] = this.incomeService.incomes().map(i => ({ ...i, type: 'income' as const }));
    const expenses: Transaction[] = this.expenseService.expenses().map(e => ({ ...e, type: 'expense' as const }));
    
    let result = [...incomes, ...expenses];

    // 1. Apply Type Filter
    const typeFilter = this.selectedType();
    if (typeFilter !== 'ALL') {
      result = result.filter(tx => tx.type === typeFilter);
    }

    // 2. Apply Category Filter
    const catFilter = this.selectedCategory();
    if (catFilter !== 'ALL') {
      result = result.filter(tx => tx.category === catFilter);
    }

    // 3. Apply ONE FINAL SORT
    result.sort((a, b) => {
      // Robust Date Parser: Handles both ISO strings and Spring Boot LocalDate arrays [YYYY, MM, DD]
      const getTimestamp = (dateVal: any) => {
        if (!dateVal) return 0;
        if (Array.isArray(dateVal) && dateVal.length >= 3) {
          return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]).getTime();
        }
        const parsed = new Date(dateVal).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };

      // Step 1: Compare dates
      const dateA = getTimestamp(a.createdAt || a.date);
      const dateB = getTimestamp(b.createdAt || b.date);

      if (dateA !== dateB) {
        return this.sortOrder() === 'DESC' ? dateB - dateA : dateA - dateB;
      }

      // Step 2: Same date -> fallback to ID
      return this.sortOrder() === 'DESC' ? (b.id || 0) - (a.id || 0) : (a.id || 0) - (b.id || 0);
    });

    console.log("Sorted Transactions:", result);
    return result;
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    this.categoryService.getAllCategories().subscribe();
    this.incomeService.fetchIncomes().subscribe();
    this.expenseService.fetchExpenses().subscribe({
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  deleteTransaction(tx: Transaction) {
    if (!tx.id) return;
    const key = `${tx.type}-${tx.id}`;
    this.notifService.confirm(
      'Delete Transaction',
      `Are you sure you want to delete this ${tx.type} of ₹${tx.amount} (${tx.category})?`,
      () => {
        this.deletingId.set(key);
        const delete$ = tx.type === 'income'
          ? this.incomeService.deleteIncome(tx.id!)
          : this.expenseService.deleteExpense(tx.id!);

        delete$.subscribe({
          next: () => {
            this.deletingId.set(null);
            this.notifService.success('Transaction Deleted', 'Successfully removed from history.');
          },
          error: () => {
            this.deletingId.set(null);
            this.notifService.error('Delete Failed', 'Could not remove transaction. Try again.');
          }
        });
      }
    );
  }

  txKey(tx: Transaction): string {
    return `${tx.type}-${tx.id}`;
  }

  toggleSort() {
    this.sortOrder.set(this.sortOrder() === 'DESC' ? 'ASC' : 'DESC');
  }
}


