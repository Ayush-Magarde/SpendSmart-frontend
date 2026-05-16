import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { validateEmail, validatePassword } from '../../utils/validators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');

    const emailErr = validateEmail(this.email);
    if (emailErr) {
      this.error.set(emailErr);
      return;
    }

    const passErr = validatePassword(this.password);
    if (passErr) {
      this.error.set(passErr);
      return;
    }

    this.loading.set(true);
    
    this.authService.login({ 
      email: this.email.trim(), 
      password: this.password.trim() 
    }).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error.set('Invalid email or password');
        this.loading.set(false);
      }
    });
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiBaseUrl}/oauth2/authorization/google`;
  }
}
