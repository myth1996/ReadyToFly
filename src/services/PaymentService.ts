/**
 * PaymentService — Razorpay premium subscription wrapper
 *
 * Handles checkout flow for:
 *  - ₹99/month
 *  - ₹499/year
 *  - ₹4,999 lifetime
 *
 * After successful payment, updates Firestore user doc via UserService
 * so isPremiumActive() returns true across all devices.
 */
import { Alert } from 'react-native';
import { RAZORPAY_KEY_ID } from '../config/env';
import { updateUser } from './UserService';

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime';

export const PLAN_DETAILS: Record<PremiumPlan, {
  label: string;
  labelHi: string;
  price: number;   // in paise (₹1 = 100 paise)
  displayPrice: string;
  displayPriceHi: string;
  badge: string;
  durationDays: number | null; // null = lifetime
}> = {
  monthly: {
    label: '1 Month',
    labelHi: '1 महीना',
    price: 9900,
    displayPrice: '₹99 / month',
    displayPriceHi: '₹99 / महीना',
    badge: '',
    durationDays: 30,
  },
  yearly: {
    label: '1 Year',
    labelHi: '1 साल',
    price: 49900,
    displayPrice: '₹499 / year',
    displayPriceHi: '₹499 / साल',
    badge: 'BEST VALUE',
    durationDays: 365,
  },
  lifetime: {
    label: 'Lifetime',
    labelHi: 'आजीवन',
    price: 499900,
    displayPrice: '₹4,999 one-time',
    displayPriceHi: '₹4,999 एकबार',
    badge: 'MOST POPULAR',
    durationDays: null,
  },
};

// ─── Initiate Razorpay Checkout ────────────────────────────────────────────────

export async function purchasePremium(
  plan: PremiumPlan,
  uid: string,
  phone: string,
): Promise<boolean> {
  const planInfo = PLAN_DETAILS[plan];

  try {
    const RazorpayCheckout = require('react-native-razorpay').default;

    const options = {
      description: `FlyEasy Premium — ${planInfo.label}`,
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: planInfo.price,
      name: 'FlyEasy',
      prefill: {
        contact: phone,
        email: '',
      },
      theme: { color: '#1A56A6' },
    };

    const data = await RazorpayCheckout.open(options);

    if (data.razorpay_payment_id) {
      // Payment succeeded — update Firestore
      const expiry = planInfo.durationDays
        ? new Date(Date.now() + planInfo.durationDays * 24 * 60 * 60 * 1000)
        : new Date('2099-12-31');

      await updateUser(uid, {
        isPremium: true,
        premiumExpiry: expiry,
      });

      Alert.alert(
        '🎉 Welcome to Premium!',
        'Thank you for upgrading. You now have unlimited flight tracking, no ads, and access to all tools.',
        [{ text: 'Awesome!' }],
      );
      return true;
    }
    return false;
  } catch (err: any) {
    if (err?.code === 0 || err?.description === 'Payment cancelled') {
      // User dismissed checkout — not an error
      return false;
    }
    Alert.alert('Payment Failed', err?.description ?? 'Something went wrong. Please try again.');
    return false;
  }
}
