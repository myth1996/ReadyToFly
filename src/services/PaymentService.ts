/**
 * PaymentService — Razorpay premium subscription wrapper
 *
 * Plans:
 *  - Trip Pass  ₹49  / 7 days   (perfect for a single trip)
 *  - Lifetime   ₹2,999 one-time  (forever)
 *
 * Free trial (3 days) is handled separately via UserService — no payment needed.
 *
 * After successful payment, updates Firestore user doc via UserService
 * so isPremiumActive() returns true across all devices.
 */
import { Alert } from 'react-native';
import { RAZORPAY_KEY_ID } from '../config/env';
import { updateUser } from './UserService';

export type PremiumPlan = 'trip' | 'lifetime';

export const PLAN_DETAILS: Record<PremiumPlan, {
  label: string;
  labelHi: string;
  price: number;   // in paise (₹1 = 100 paise)
  displayPrice: string;
  displayPriceHi: string;
  badge: string;
  durationDays: number | null; // null = lifetime
}> = {
  trip: {
    label: 'Trip Pass',
    labelHi: 'ट्रिप पास',
    price: 4900,            // ₹49
    displayPrice: '₹49 / 7 days',
    displayPriceHi: '₹49 / 7 दिन',
    badge: 'TRIP SPECIAL',
    durationDays: 7,
  },
  lifetime: {
    label: 'Lifetime',
    labelHi: 'आजीवन',
    price: 299900,          // ₹2,999
    displayPrice: '₹2,999 one-time',
    displayPriceHi: '₹2,999 एकबार',
    badge: 'BEST VALUE',
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
      description: `ReadyToFly Premium — ${planInfo.label}`,
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: planInfo.price,
      name: 'ReadyToFly',
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

      const successMsg = plan === 'trip'
        ? 'Your Trip Pass is active for 7 days. Enjoy ad-free flying!'
        : 'You now have lifetime access to all ReadyToFly features. Thank you!';

      Alert.alert('🎉 Welcome to Premium!', successMsg, [{ text: 'Let\'s fly!' }]);
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
