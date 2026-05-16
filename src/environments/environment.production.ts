// PRODUCTION environment — used automatically by `ng build` (default is production)
//
// ⚠️  ACTION REQUIRED AFTER EC2 DEPLOYMENT:
//    Replace "http://YOUR_EC2_PUBLIC_IP:8080" with your actual EC2 public IP or domain.
//    Example: http://13.233.xx.xx:8080
//    Example: https://api.spendsmart.com  (if you configure a domain + HTTPS)
//
// The Angular frontend (Netlify) is NOT the backend.
// This URL must point to the API Gateway running on EC2.
export const environment = {
  production: true,
  apiBaseUrl: 'http://YOUR_EC2_PUBLIC_IP:8080', // ← Replace after EC2 deployment
};
