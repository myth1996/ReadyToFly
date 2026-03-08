/**
 * Centralised environment configuration.
 *
 * In production, swap these with values from a .env file
 * (via react-native-config) or a build-time secret injection.
 * NEVER commit real keys — keep them in .env and add .env to .gitignore.
 */

// ─── AviationStack (Flight Data) ─────────────────────────────────────────────
export const AVIATION_STACK_KEY = 'YOUR_AVIATIONSTACK_KEY_HERE';
export const AVIATION_STACK_BASE_URL = 'https://api.aviationstack.com/v1';

// ─── Google AdMob ────────────────────────────────────────────────────────────
// Test IDs — swap to production IDs before release
export const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
export const ADMOB_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// ─── Razorpay ────────────────────────────────────────────────────────────────
export const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID';

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const FEATURES = {
  /** Maximum free flights (premium = unlimited) */
  MAX_FREE_FLIGHTS: 3,
  /** Minimum seconds between flight data refreshes */
  REFRESH_COOLDOWN_SEC: 120,
  /** Show mock flight data when API key is placeholder */
  USE_MOCK_DATA: AVIATION_STACK_KEY === 'YOUR_AVIATIONSTACK_KEY_HERE',
};
