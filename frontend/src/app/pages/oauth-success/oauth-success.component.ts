import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  template: '<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white;">Finalizing login...</div>'
})
export class OAuthSuccessComponent implements OnInit {
  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.handleOAuthSuccess(token);
      } else {
        // Handle error
        console.error('No token found in OAuth callback');
      }
    });
  }
}
