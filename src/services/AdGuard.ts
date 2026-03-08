/**
 * AdGuard — Central Ad Suppression Utility
 *
 * Blocks ALL ads in these scenarios:
 *   1. Within 2 hours of the next flight's departure
 *   2. When the user is in Calm Mode (permanent suppression)
 *   3. When the user is a premium subscriber
 *
 * Usage:
 *   const ok = AdGuard.canShowAd(isPremiumUser, nextFlight, isCalmMode);
 *   if (!ok) return;
 *   // show ad
 */

import { FlightData } from './FlightService';

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Suppress ads this many milliseconds before departure */
const SUPPRESS_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Core Guard ────────────────────────────────────────────────────────────────

/**
 * Returns true if an ad may be shown right now.
 * Returns false if any suppression condition is active.
 */
function canShowAd(
  isPremiumUser: boolean,
  nextFlight: FlightData | null,
  isCalmMode?: boolean,
): boolean {
  // 1. Premium users — never show ads
  if (isPremiumUser) { return false; }

  // 2. Calm Mode — permanent suppression while screen is active
  if (isCalmMode) { return false; }

  // 3. Within 2 hrs of departure — suppress all ads for low-stress experience
  if (nextFlight?.dep?.scheduledTime) {
    const depMs = new Date(nextFlight.dep.scheduledTime).getTime();
    const now   = Date.now();
    if (now >= depMs - SUPPRESS_WINDOW_MS && now < depMs + SUPPRESS_WINDOW_MS) {
      return false;
    }
  }

  return true;
}

/**
 * Checks only the 2-hour flight window (no premium / calm-mode checks).
 * Useful for banner ads that are already gated elsewhere.
 */
function isInFlightWindow(nextFlight: FlightData | null): boolean {
  if (!nextFlight?.dep?.scheduledTime) { return false; }
  const depMs = new Date(nextFlight.dep.scheduledTime).getTime();
  const now   = Date.now();
  return now >= depMs - SUPPRESS_WINDOW_MS && now < depMs + SUPPRESS_WINDOW_MS;
}

// ─── Export ────────────────────────────────────────────────────────────────────

export const AdGuard = {
  canShowAd,
  isInFlightWindow,
  SUPPRESS_WINDOW_MS,
};
