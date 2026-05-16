import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { VerifyOtpComponent } from './pages/verify-otp/verify-otp.component';
import { OAuthSuccessComponent } from './pages/oauth-success/oauth-success.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

import { IncomeComponent } from './pages/income/income.component';
import { ExpenseComponent } from './pages/expense/expense.component';
import { BreakdownComponent } from './pages/breakdown/breakdown.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { BudgetComponent } from './pages/budget/budget.component';
import { NotificationPageComponent } from './pages/notifications/notification-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'oauth-success', component: OAuthSuccessComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'income', component: IncomeComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpenseComponent, canActivate: [authGuard] },
  { path: 'breakdown', component: BreakdownComponent, canActivate: [authGuard] },
  { path: 'budget', component: BudgetComponent, canActivate: [authGuard] },
  { path: 'recurring', loadComponent: () => import('./pages/recurring/recurring.component').then(c => c.RecurringComponent), canActivate: [authGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
