/**
 * Centralised environment configuration.
 *
 * In production, swap these with values from a .env file
 * (via react-native-config) or a build-time secret injection.
 * NEVER commit real keys — keep them in .env and add .env to .gitignore.
 */

// ─── AeroDataBox via RapidAPI (Flight Data) ───────────────────────────────────
export const AERODATABOX_KEY = '044efee8dbmsh4dab3876b557a92p13aff0jsn709aaca4b4ee';
export const AERODATABOX_HOST = 'aerodatabox.p.rapidapi.com';
export const AERODATABOX_BASE_URL = 'https://aerodatabox.p.rapidapi.com';

// ─── Google AdMob ────────────────────────────────────────────────────────────
// Production IDs — FlyEasy Android (ca-app-pub-9393363655749831~3718034797)
export const ADMOB_BANNER_ID      = 'ca-app-pub-9393363655749831/1539573950';
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-9393363655749831/1587170832';
export const ADMOB_REWARDED_ID    = 'ca-app-pub-9393363655749831/4527719438';

// ─── Razorpay ────────────────────────────────────────────────────────────────
export const RAZORPAY_KEY_ID = 'rzp_live_SQiCX1MacGwBXU';

// ─── 360dialog (WhatsApp API — Premium users) ────────────────────────────────
// Register at https://360dialog.com — free trial, then ~€49/mo
export const DIALOG360_API_KEY = 'YOUR_360DIALOG_KEY_HERE';

// ─── MSG91 (SMS fallback) ────────────────────────────────────────────────────
// Register at https://msg91.com — ₹500 minimum top-up
export const MSG91_AUTH_KEY = 'YOUR_MSG91_AUTH_KEY_HERE';

// ─── Feature Flags ───────────────────────────────────────────────────────────
export const FEATURES = {
  /** Maximum free flights (premium = unlimited) */
  MAX_FREE_FLIGHTS: 3,
  /** Minimum seconds between flight data refreshes */
  REFRESH_COOLDOWN_SEC: 120,
  /**
   * DEBUG: Force free-user mode so all ad placements are visible.
   * Set to false before publishing to Play Store.
   */
  DEBUG_FORCE_FREE_USER: false,
};
