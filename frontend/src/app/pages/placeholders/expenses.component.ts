import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [SidebarComponent],
  template: `
    <div class="dashboard-layout">
      <app-sidebar></app-sidebar>
      <main class="dashboard-main central-content">
        <div class="welcome-card glass">
          <h1>💸 Expenses</h1>
          <p>Functionality coming soon</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      display: flex;
      background: var(--bg-dark);
    }
    .central-content {
      margin-left: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(100% - 280px);
    }
    .welcome-card {
      padding: 4rem;
      text-align: center;
      max-width: 600px;
      border-radius: 2rem;
      border: 1px solid var(--border);
    }
    @media (max-width: 1024px) {
      .central-content {
        margin-left: 80px;
        width: calc(100% - 80px);
      }
    }
  `]
})
export class ExpensesComponent {}
