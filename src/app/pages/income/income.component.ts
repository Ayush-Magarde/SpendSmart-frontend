import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { IncomeService, Income } from '../../services/income.service';
import { CategoryService, Category } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { SummaryService } from '../../services/summary.service';
import { RecurringService } from '../../services/recurring.service';
import { validateAmount, validateDescription, validateName } from '../../utils/validators';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './income.component.html',
  styleUrl: './income.component.css'
})
export class IncomeComponent implements OnInit {
  private incomeService = inject(IncomeService);
  private categoryService = inject(CategoryService);
  private summaryService = inject(SummaryService);
  private recurringService = inject(RecurringService);
  private notifService = inject(NotificationService);

  // Form state
  amount = '';
  category = '';
  description = '';
  
  // Recurring State
  isRecurring = false;
  ruleName = '';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'MONTHLY';
  
  // New Category State
  showAddCategory = signal(false);
  newCategoryName = '';
  addingCategory = signal(false);
  deletingId = signal<number | null>(null);

  loading = signal(false);
  error = signal('');
  
  // Dynamic categories from service
  allCategories = this.categoryService.categories;
  incomeCategories = computed(() => 
    this.allCategories().filter(c => c.type === 'INCOME')
  );

  // Read state from service
  incomes = this.incomeService.incomes;

  recentIncomes = computed(() => {
    return [...this.incomes()]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return (dateB - dateA) || ((b.id || 0) - (a.id || 0));
      })
      .slice(0, 5);
  });

  ngOnInit() {
    this.fetchIncomes();
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      error: () => this.error.set('Failed to load categories')
    });
  }

  fetchIncomes() {
    this.incomeService.fetchIncomes().subscribe({
      error: (err) => this.error.set('Failed to load incomes')
    });
  }

  onCategoryChange(val: string) {
    this.category = val;
  }

  saveCategory() {
    const nameErr = validateName(this.newCategoryName, 'Category name');
    if (nameErr) {
      this.error.set(nameErr);
      return;
    }
    
    this.addingCategory.set(true);
    const payload = {
      name: this.newCategoryName.trim(),
      type: 'INCOME' as const,
      isDefault: false
    };

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.addingCategory.set(true);
        this.newCategoryName = '';
        this.loadCategories();
        this.addingCategory.set(false);
      },
      error: (err) => {
        console.error('Failed to create category:', err);
        this.error.set('Failed to create category');
        this.addingCategory.set(false);
      }
    });
  }

  cancelAddCategory() {
    this.showAddCategory.set(false);
    this.newCategoryName = '';
  }

  isDefaultCategory(name: string): boolean {
    return this.incomeCategories().find(c => c.name === name)?.isDefault || false;
  }

  deleteSelectedCategory(cat: Category) {
    if (!cat || cat.isDefault) {
      console.warn('Cannot delete: Category not found or is default');
      return;
    }

    this.notifService.confirm(
      'Delete Category',
      `Are you sure you want to delete the category "${cat.name}"? This will also remove any associated budget.`,
      () => {
        this.categoryService.deleteCategory(cat.id!).subscribe({
          next: () => {
            if (this.category === cat.name) this.category = '';
            this.loadCategories();
            this.notifService.success('Category Deleted', `Successfully removed ${cat.name}`);
          },
          error: (err) => {
            this.error.set('Failed to delete category: ' + (err.error?.message || 'Server error'));
          }
        });
      }
    );
  }

  deleteIncome(income: Income) {
    if (!income.id) return;
    this.notifService.confirm(
      'Delete Income',
      `Delete this ₹${income.amount} income (${income.category})?`,
      () => {
        this.deletingId.set(income.id!);
        this.incomeService.deleteIncome(income.id!).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.notifService.success('Income Deleted', 'The transaction has been removed.');
          },
          error: () => {
            this.error.set('Failed to delete income. Please try again.');
            this.deletingId.set(null);
          }
        });
      }
    );
  }

  onSubmit() {
    this.error.set('');

    const amountErr = validateAmount(this.amount);
    if (amountErr) {
      this.error.set(amountErr);
      return;
    }

    if (!this.category) {
      this.error.set('Please select a category');
      return;
    }

    const descErr = validateDescription(this.description);
    if (descErr) {
      this.error.set(descErr);
      return;
    }

    if (this.isRecurring) {
      const ruleErr = validateName(this.ruleName, 'Rule name');
      if (ruleErr) {
        this.error.set(ruleErr);
        return;
      }
    }

    this.loading.set(true);

    const newIncome: Income = {
      amount: parseFloat(String(this.amount).trim()),
      category: this.category,
      description: this.description.trim()
    };

    this.incomeService.addIncome(newIncome).subscribe({
      next: () => {
        this.notifService.success('Income Added', `₹${newIncome.amount} added to ${newIncome.category}`);
        // If recurring is enabled, create the rule as well
        if (this.isRecurring) {
          this.recurringService.createRule({
            name: this.ruleName || this.description,
            type: 'INCOME',
            amount: newIncome.amount,
            frequency: this.frequency
          }).subscribe();
        }
        
        this.resetForm();
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to add income. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private resetForm() {
    this.amount = '';
    this.category = '';
    this.description = '';
    this.isRecurring = false;
    this.ruleName = '';
    this.frequency = 'MONTHLY';
  }
}
