import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// TODO: Replace test IDs with your real AdMob unit IDs before publishing
const AD_UNIT_IDS = {
  // Test IDs (safe to use during development)
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED: TestIds.REWARDED,

  // Production IDs — uncomment and fill in when going live:
  // BANNER: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  // REWARDED: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

class AdService {
  private interstitial: InterstitialAd;
  private rewarded: RewardedAd;
  private screenViewCount = 0;
  private interstitialLoaded = false;
  private rewardedLoaded = false;

  constructor() {
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
    this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
    this.loadInterstitial();
    this.loadRewarded();
  }

  private loadInterstitial() {
    this.interstitialLoaded = false;
    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.interstitialLoaded = true;
    });
    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      // Reload for next time
      this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
      this.loadInterstitial();
    });
    this.interstitial.load();
  }

  private loadRewarded() {
    this.rewardedLoaded = false;
    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.rewardedLoaded = true;
    });
    this.rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
      this.loadRewarded();
    });
    this.rewarded.load();
  }

  // Call this on every screen navigation
  onScreenView(isPremiumUser: boolean) {
    if (isPremiumUser) {return;}
    this.screenViewCount += 1;
    if (this.screenViewCount % 3 === 0 && this.interstitialLoaded) {
      this.interstitial.show();
    }
  }

  // Call this to show rewarded ad (e.g. in Airport Guide)
  showRewardedAd(
    isPremiumUser: boolean,
    onRewarded: () => void,
    onFailed?: () => void,
  ) {
    if (isPremiumUser) {
      onRewarded();
      return;
    }
    if (!this.rewardedLoaded) {
      onFailed?.();
      return;
    }
    this.rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => onRewarded(),
    );
    this.rewarded.show();
  }

  getBannerUnitId() {
    return AD_UNIT_IDS.BANNER;
  }
}

export const adService = new AdService();
export { AD_UNIT_IDS };
