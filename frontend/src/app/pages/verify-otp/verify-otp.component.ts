import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: '../login/login.component.css'
})
export class VerifyOtpComponent implements OnInit {
  email = '';
  otp = '';
  loading = signal(false);
  error = signal('');

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/register']);
      }
    });
  }

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    this.authService.registerVerify({ email: this.email, otp: this.otp }).subscribe({
      next: () => {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error.set('Invalid OTP. Please check your email.');
        this.loading.set(false);
      }
    });
  }
}
