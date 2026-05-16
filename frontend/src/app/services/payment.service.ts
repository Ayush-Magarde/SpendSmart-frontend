import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Observable, firstValueFrom } from 'rxjs';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  
  // Razorpay Key from backend .env
  private readonly RAZORPAY_KEY = 'rzp_test_ShcC8NQFdgb8G0';
  private readonly API_URL = 'http://localhost:8080/api/payments';

  constructor() {}

  createOrder(): Observable<any> {
    const email = this.authService.currentUser()?.email || '';
    const headers = new HttpHeaders().set('X-User-Email', email);
    return this.http.post(`${this.API_URL}/create-order`, {}, { headers });
  }

  verifyPayment(payload: any): Observable<any> {
    const email = this.authService.currentUser()?.email || '';
    const headers = new HttpHeaders().set('X-User-Email', email);
    return this.http.post(`${this.API_URL}/verify`, payload, { headers });
  }

  async payForPremium() {
    // 0. Guard: Prevent multiple payments
    if (this.authService.isPremium()) {
      this.notifService.showToast('Already Premium', 'You are already a Premium member! 🚀', 'INFO');
      return;
    }

    try {
      // 1. Create Order
      const order = await firstValueFrom(this.createOrder());
      
      const options = {
        key: this.RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'SpendSmart Premium',
        description: 'Upgrade to Unlock Advanced Insights',
        order_id: order.orderId,
        handler: async (response: any) => {
          // 2. Verify Payment
          const verifyPayload = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          };
          
          try {
            const result = await firstValueFrom(this.verifyPayment(verifyPayload));
            if (result.success) {
              this.authService.updatePremiumStatus(true);
              this.notifService.success('Upgrade Successful', 'You are now a Premium Member 🚀');
            } else {
              this.notifService.error('Verification Failed', result.message);
            }
          } catch (err) {
            this.notifService.error('Service Error', 'Error during verification. Please contact support.');
          }
        },
        prefill: {
          name: this.authService.currentUser()?.name,
          email: this.authService.currentUser()?.email
        },
        theme: {
          color: '#9333ea'
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      this.notifService.error('Payment Error', 'Failed to initiate payment. Please try again.');
    }
  }
}
