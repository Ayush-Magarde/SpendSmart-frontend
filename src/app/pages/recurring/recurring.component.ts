import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RecurringService, RecurringRule } from '../../services/recurring.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './recurring.component.html',
  styleUrl: './recurring.component.css'
})
export class RecurringComponent implements OnInit {
  private recurringService = inject(RecurringService);
  private notifService = inject(NotificationService);

  loading = signal(false);
  error = signal('');
  deletingId = signal<number | null>(null);

  rules = this.recurringService.rules;

  ngOnInit() {
    this.loadRules();
  }

  loadRules() {
    this.loading.set(true);
    this.recurringService.fetchRules().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.error.set('Failed to load recurring rules');
        this.loading.set(false);
      }
    });
  }

  deleteRule(rule: RecurringRule) {
    if (!rule.id) return;
    this.notifService.confirm(
      'Delete Recurring Rule',
      `Are you sure you want to delete the recurring rule "${rule.name}"? This will stop future automatic transactions.`,
      () => {
        this.deletingId.set(rule.id!);
        this.recurringService.deleteRule(rule.id!).subscribe({
          next: () => {
            this.deletingId.set(null);
            this.notifService.success('Rule Deleted', `Successfully stopped ${rule.name}`);
          },
          error: () => {
            this.error.set('Failed to delete rule');
            this.deletingId.set(null);
          }
        });
      }
    );
  }
}
