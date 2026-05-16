import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { validateName, validateEmail, validatePassword } from '../../utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.css' // Reuse styles
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.error.set('');

    const nameErr = validateName(this.name);
    if (nameErr) {
      this.error.set(nameErr);
      return;
    }

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

    const data = { 
      name: this.name.trim(), 
      email: this.email.trim(), 
      password: this.password.trim() 
    };
    
    this.authService.registerInit(data).subscribe({
      next: () => {
        this.router.navigate(['/verify-otp'], { queryParams: { email: this.email.trim() } });
      },
      error: (err) => {
        this.error.set('Failed to initiate registration. User might already exist.');
        this.loading.set(false);
      }
    });
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }
}
