import { execSync } from 'child_process';

const stripeLogin = () => {
  try {
    // Forward webhooks to your local server using ngrok
    execSync(`stripe listen --forward-to http://localhost:8080/webhooks/stripe`);
  } catch (error) {
    console.error('Error setting up Stripe CLI:', error);
  }
};

stripeLogin();
