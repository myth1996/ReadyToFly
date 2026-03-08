/**
 * AdService — Production-ready AdMob integration for FlyEasy
 *
 * Ad units:
 *  - App Open Ad     : cold launch (once per day, guarded by AsyncStorage timestamp)
 *  - Interstitial    : after "Save to My Trips" (8-minute app-wide cooldown)
 *  - Rewarded        : unlocks Airport Guide details for non-premium users
 *  - Native Content  : styled MiniFlightCard in "Other Trips" horizontal scroll
 *  - Adaptive Banner : sticky footer on Visa + Baggage Rules screens
 *
 * All ad placements are gated by AdGuard.canShowAd() — no ads within 2h of
 * departure, in Calm Mode, or for premium users.
 *
 * Test device: emulator + physical device hash registered below.
 * TODO: Replace TestIds with real unit IDs before publishing to Play Store.
 */

import {
  InterstitialAd,
  RewardedAd,
  AppOpenAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
  RequestConfiguration,
  MobileAds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Ad Unit IDs ───────────────────────────────────────────────────────────────
// Swap TestIds for real unit IDs in the production build.
// Format: ca-app-pub-<publisher>/<unit>

export const AD_UNIT_IDS = {
  APP_OPEN:     TestIds.APP_OPEN,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED:     TestIds.REWARDED,
  NATIVE:       TestIds.NATIVE,      // Native content ad
  BANNER:       TestIds.BANNER,      // Adaptive banner

  // ── Production IDs (fill before release) ──────────────────────────────────
  // APP_OPEN:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // REWARDED:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // NATIVE:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // BANNER:       'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

// ─── Test Device Registration ──────────────────────────────────────────────────
// Add your physical device's advertising ID hash here for real-device testing.
// Find it in logcat: "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList("XXXXXXXX"))"
const TEST_DEVICE_IDS: string[] = [
  // 'YOUR_DEVICE_HASH_HERE',  // e.g. Motorola Edge 40 neo
];

// ─── AsyncStorage Keys ─────────────────────────────────────────────────────────
const KEY_APP_OPEN_LAST_SHOWN    = 'flyeasy_app_open_last_shown';
const KEY_INTERSTITIAL_LAST_SHOWN = 'flyeasy_interstitial_last_shown';

// ─── Cooldown Constants ────────────────────────────────────────────────────────
const APP_OPEN_COOLDOWN_MS   = 24 * 60 * 60 * 1000; // 24 hours (once per day)
const INTERSTITIAL_COOLDOWN_MS = 8 * 60 * 1000;     //  8 minutes

// ─── AdService Class ───────────────────────────────────────────────────────────

class AdService {
  private appOpen: AppOpenAd | null = null;
  private appOpenLoaded   = false;
  private appOpenLoading  = false;

  private interstitial: InterstitialAd;
  private interstitialLoaded = false;

  private rewarded: RewardedAd;
  private rewardedLoaded = false;

  constructor() {
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
    this.rewarded     = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
    this._initMobileAds();
    this._loadInterstitial();
    this._loadRewarded();
  }

  // ── Initialise SDK + test devices ──────────────────────────────────────────

  private async _initMobileAds(): Promise<void> {
    try {
      if (TEST_DEVICE_IDS.length > 0) {
        await MobileAds().setRequestConfiguration({
          testDeviceIdentifiers: TEST_DEVICE_IDS,
        } as RequestConfiguration);
      }
      await MobileAds().initialize();
    } catch (_) {}
  }

  // ── App Open Ad ────────────────────────────────────────────────────────────

  /** Pre-load an App Open Ad (call once after auth resolves) */
  preloadAppOpen(): void {
    if (this.appOpenLoading || this.appOpenLoaded) { return; }
    this.appOpenLoading = true;
    try {
      this.appOpen = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN);
      this.appOpen.addAdEventListener(AdEventType.LOADED, () => {
        this.appOpenLoaded  = true;
        this.appOpenLoading = false;
      });
      this.appOpen.addAdEventListener(AdEventType.ERROR, () => {
        this.appOpenLoaded  = false;
        this.appOpenLoading = false;
      });
      this.appOpen.addAdEventListener(AdEventType.CLOSED, () => {
        this.appOpenLoaded  = false;
        this.appOpenLoading = false;
        // Pre-load next one silently
        setTimeout(() => this.preloadAppOpen(), 2000);
      });
      this.appOpen.load();
    } catch (_) {
      this.appOpenLoading = false;
    }
  }

  /**
   * Show App Open Ad if:
   *  - Ad is loaded
   *  - Last shown > 24 hours ago (per AsyncStorage)
   *  - AdGuard permits it (not premium, not near departure)
   */
  async showAppOpenIfReady(canShow: boolean): Promise<void> {
    if (!canShow || !this.appOpenLoaded || !this.appOpen) { return; }
    try {
      const raw = await AsyncStorage.getItem(KEY_APP_OPEN_LAST_SHOWN);
      const lastShown = raw ? parseInt(raw, 10) : 0;
      if (Date.now() - lastShown < APP_OPEN_COOLDOWN_MS) { return; }
      await AsyncStorage.setItem(KEY_APP_OPEN_LAST_SHOWN, String(Date.now()));
      await this.appOpen.show();
    } catch (_) {}
  }

  // ── Interstitial ───────────────────────────────────────────────────────────

  private _loadInterstitial(): void {
    this.interstitialLoaded = false;
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.interstitialLoaded = true;
    });
    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      // Reload immediately for next trigger
      setTimeout(() => this._loadInterstitial(), 500);
    });
    this.interstitial.addAdEventListener(AdEventType.ERROR, () => {
      this.interstitialLoaded = false;
      setTimeout(() => this._loadInterstitial(), 30_000); // retry in 30s
    });
    this.interstitial.load();
  }

  /**
   * Show interstitial with 8-minute app-wide cooldown.
   * Call after "Save to My Trips" animation completes.
   * Pass canShow from AdGuard.canShowAd().
   */
  async showInterstitialAfterSave(canShow: boolean): Promise<void> {
    if (!canShow || !this.interstitialLoaded) { return; }
    try {
      const raw = await AsyncStorage.getItem(KEY_INTERSTITIAL_LAST_SHOWN);
      const lastShown = raw ? parseInt(raw, 10) : 0;
      if (Date.now() - lastShown < INTERSTITIAL_COOLDOWN_MS) { return; }
      await AsyncStorage.setItem(KEY_INTERSTITIAL_LAST_SHOWN, String(Date.now()));
      await this.interstitial.show();
    } catch (_) {}
  }

  // ── Rewarded Ad ────────────────────────────────────────────────────────────

  private _loadRewarded(): void {
    this.rewardedLoaded = false;
    this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.rewardedLoaded = true;
    });
    this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      this.rewardedLoaded = false;
      setTimeout(() => this._loadRewarded(), 500);
    });
    this.rewarded.addAdEventListener(AdEventType.ERROR, () => {
      this.rewardedLoaded = false;
      setTimeout(() => this._loadRewarded(), 30_000);
    });
    this.rewarded.load();
  }

  /** Returns true if a rewarded ad is ready to show */
  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }

  /**
   * Show rewarded ad to unlock Airport Guide details.
   * If premium: immediately call onRewarded (no ad).
   * If ad not ready: silently call onFailed (graceful fallback = show content anyway).
   */
  showRewardedForAirportGuide(
    isPremiumUser: boolean,
    onRewarded: () => void,
    onFailed?: () => void,
  ): void {
    // Premium users always get content for free
    if (isPremiumUser) {
      onRewarded();
      return;
    }
    if (!this.rewardedLoaded) {
      // Silent fallback — never punish the user for an ad not loading
      onFailed?.();
      return;
    }
    const cleanup = this.rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        cleanup();
        onRewarded();
      },
    );
    this.rewarded.show().catch(() => {
      cleanup();
      onFailed?.();
    });
  }

  // ── Banner / Native helpers ────────────────────────────────────────────────

  /** Returns the adaptive banner unit ID */
  getBannerUnitId(): string {
    return AD_UNIT_IDS.BANNER;
  }

  /** Returns the native content ad unit ID */
  getNativeUnitId(): string {
    return AD_UNIT_IDS.NATIVE;
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────────

export const adService = new AdService();
