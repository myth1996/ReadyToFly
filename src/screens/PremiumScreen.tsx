import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { purchasePremium, PLAN_DETAILS, PremiumPlan } from '../services/PaymentService';
import { haptic } from '../services/HapticService';

// Premium-only features
const PREMIUM_FEATURES = [
  { icon: '🚫', label: 'Ad-free experience',       free: 'Ads shown',    premium: 'Completely ad-free' },
  { icon: '✈️', label: 'Unlimited flight tracking', free: 'Up to 3 flights', premium: 'Track unlimited flights' },
  { icon: '🔔', label: 'Instant push alerts',       free: 'No alerts',    premium: 'Real-time gate & delay alerts' },
];

// Always-free features
const FREE_FEATURES = [
  { icon: '😌', label: 'Calm Mode',       desc: '4-7-8 breathing — always free', highlight: true },
  { icon: '📋', label: 'Doc Checklist',   desc: 'Passport, boarding pass & more', highlight: false },
  { icon: '🧳', label: 'Baggage Rules',   desc: 'Airline-wise allowances',        highlight: false },
  { icon: '🗺️', label: 'Airport Guide',  desc: 'Maps, lounges & facilities',     highlight: false },
  { icon: '🌍', label: 'Visa Info',       desc: 'Entry requirements by country',  highlight: false },
  { icon: '🏅', label: 'Frequent Flyer', desc: 'Track your loyalty programmes',  highlight: false },
];

export function PremiumScreen() {
  const { user, isPremiumUser, isInTrial, trialEligible, startFreeTrial, refreshPremiumStatus } = useAuth();
  const { themeColors: c, language } = useSettings();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>('lifetime');
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) { return; }
    haptic.impact();
    setLoading(true);
    try {
      const success = await purchasePremium(selectedPlan, user.uid, user.phoneNumber ?? '');
      if (success) {
        // Refresh in-memory premium state immediately — no sign-out required
        await refreshPremiumStatus();
        haptic.success();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    haptic.impact();
    setTrialLoading(true);
    try {
      const started = await startFreeTrial();
      if (started) {
        Alert.alert(
          '🎁 Free Trial Started!',
          'You have 3 days of full premium access — completely free. Enjoy!',
          [{ text: 'Let\'s fly! ✈️' }],
        );
      }
    } finally {
      setTrialLoading(false);
    }
  };

  // Already premium (paid or active trial)
  if (isPremiumUser) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.alreadyPremiumCard, { backgroundColor: c.primary }]}>
          <Text style={styles.premiumEmoji}>{isInTrial ? '🎁' : '👑'}</Text>
          <Text style={styles.premiumActiveTitle}>
            {isInTrial ? 'Free Trial Active!' : 'You\'re Premium!'}
          </Text>
          <Text style={styles.premiumActiveDesc}>
            {isInTrial
              ? 'You have full premium access for 3 days. Upgrade anytime to keep it forever.'
              : 'You have full access to all ReadyToFly features. Thank you for your support!'}
          </Text>
        </View>

        {/* Show upgrade plans even during trial */}
        {isInTrial && (
          <>
            <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24 }]}>
              Upgrade Before Trial Ends
            </Text>
            {(Object.keys(PLAN_DETAILS) as PremiumPlan[]).map(plan => {
              const info = PLAN_DETAILS[plan];
              const isSelected = selectedPlan === plan;
              const displayPrice = language === 'hi' ? info.displayPriceHi : info.displayPrice;
              const displayLabel = language === 'hi' ? info.labelHi : info.label;
              return (
                <TouchableOpacity
                  key={plan}
                  style={[
                    styles.planCard,
                    { backgroundColor: c.card, borderColor: c.border },
                    isSelected && { borderColor: c.primary, backgroundColor: c.primary + '0D' },
                  ]}
                  onPress={() => { haptic.selection(); setSelectedPlan(plan); }}
                  activeOpacity={0.75}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planRadio, { borderColor: c.border }, isSelected && { borderColor: c.primary }]}>
                      {isSelected && <View style={[styles.planRadioFill, { backgroundColor: c.primary }]} />}
                    </View>
                    <View>
                      <Text style={[styles.planLabel, { color: c.text }]}>{displayLabel}</Text>
                      <Text style={[styles.planPrice, { color: isSelected ? c.primary : c.text }]}>{displayPrice}</Text>
                    </View>
                  </View>
                  {info.badge ? (
                    <View style={[styles.planBadge, { backgroundColor: isSelected ? c.primary : '#6B7280' }]}>
                      <Text style={styles.planBadgeText}>{info.badge}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: c.primary }, loading && { opacity: 0.7 }]}
              onPress={handlePurchase}
              disabled={loading}
              activeOpacity={0.8}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.ctaBtnText}>
                    Upgrade — {language === 'hi'
                      ? PLAN_DETAILS[selectedPlan].displayPriceHi
                      : PLAN_DETAILS[selectedPlan].displayPrice}
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}

        <View style={[styles.featuresCard, { backgroundColor: c.card, marginTop: 20 }]}>
          {PREMIUM_FEATURES.map(f => (
            <View key={f.label} style={[styles.featureRow, { borderBottomColor: c.border }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
                <Text style={[styles.featureValue, { color: '#10B981' }]}>{f.premium}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: c.primary }]}>
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
        <Text style={styles.heroEmoji}>👑</Text>
        <Text style={styles.heroTitle}>ReadyToFly Premium</Text>
        <Text style={styles.heroSubtitle}>Fly smarter. Worry less.</Text>
      </View>

      {/* 3-day Free Trial Banner — only for eligible users */}
      {trialEligible && (
        <View style={styles.trialBanner}>
          <View style={styles.trialBannerLeft}>
            <Text style={styles.trialBannerEmoji}>🎁</Text>
            <View>
              <Text style={styles.trialBannerTitle}>Try Premium Free for 3 Days</Text>
              <Text style={styles.trialBannerDesc}>No payment. No card required. One offer per account.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.trialBtn, trialLoading && { opacity: 0.7 }]}
            onPress={handleStartTrial}
            disabled={trialLoading}
            activeOpacity={0.8}>
            {trialLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.trialBtnText}>Start Free</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Premium-only benefits */}
      <Text style={[styles.sectionLabel, { color: c.text }]}>What you unlock with Premium</Text>
      <View style={[styles.featuresCard, { backgroundColor: c.card }]}>
        <View style={styles.featureHeader}>
          <Text style={[styles.featureHeaderBlank, { color: c.text }]}>Feature</Text>
          <Text style={[styles.featureHeaderFree, { color: c.textSecondary }]}>Free</Text>
          <Text style={[styles.featureHeaderPremium, { color: c.primary }]}>Premium</Text>
        </View>
        {PREMIUM_FEATURES.map((f, i) => (
          <View
            key={f.label}
            style={[
              styles.featureRow,
              { borderBottomColor: c.border },
              i === PREMIUM_FEATURES.length - 1 && { borderBottomWidth: 0 },
            ]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
            <Text style={[styles.featureFree, { color: c.textSecondary }]}>{f.free}</Text>
            <Text style={[styles.featurePremium, { color: '#10B981' }]}>✓ {f.premium}</Text>
          </View>
        ))}
      </View>

      {/* Always-free features */}
      <Text style={[styles.sectionLabel, { color: c.text }]}>Always free for everyone</Text>
      <View style={[styles.featuresCard, { backgroundColor: c.card }]}>
        {FREE_FEATURES.map((f, i) => (
          <View
            key={f.label}
            style={[
              styles.freeRow,
              { borderBottomColor: c.border },
              f.highlight && { backgroundColor: '#2D1B6914' },
              i === FREE_FEATURES.length - 1 && { borderBottomWidth: 0 },
            ]}>
            <Text style={[styles.featureIcon, f.highlight && styles.featureIconHighlight]}>{f.icon}</Text>
            <View style={styles.freeInfo}>
              <Text style={[styles.freeLabel, { color: c.text }, f.highlight && styles.freeLabelHighlight]}>
                {f.label}{f.highlight ? '  ⭐ Top Pick' : ''}
              </Text>
              <Text style={[styles.freeDesc, { color: c.textSecondary }]}>{f.desc}</Text>
            </View>
            <Text style={styles.freeTick}>✓</Text>
          </View>
        ))}
      </View>

      {/* Plan selector */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Choose a Plan</Text>

      {(Object.keys(PLAN_DETAILS) as PremiumPlan[]).map(plan => {
        const info = PLAN_DETAILS[plan];
        const isSelected = selectedPlan === plan;
        const displayPrice = language === 'hi' ? info.displayPriceHi : info.displayPrice;
        const displayLabel = language === 'hi' ? info.labelHi : info.label;
        return (
          <TouchableOpacity
            key={plan}
            style={[
              styles.planCard,
              { backgroundColor: c.card, borderColor: c.border },
              isSelected && { borderColor: c.primary, backgroundColor: c.primary + '0D' },
            ]}
            onPress={() => { haptic.selection(); setSelectedPlan(plan); }}
            activeOpacity={0.75}>
            <View style={styles.planLeft}>
              <View style={[styles.planRadio, { borderColor: c.border }, isSelected && { borderColor: c.primary }]}>
                {isSelected && <View style={[styles.planRadioFill, { backgroundColor: c.primary }]} />}
              </View>
              <View>
                <Text style={[styles.planLabel, { color: c.text }]}>{displayLabel}</Text>
                <Text style={[styles.planPrice, { color: isSelected ? c.primary : c.text }]}>{displayPrice}</Text>
                {plan === 'trip' && (
                  <Text style={[styles.planSubtext, { color: c.textSecondary }]}>Perfect for one trip ✈️</Text>
                )}
                {plan === 'lifetime' && (
                  <Text style={[styles.planSubtext, { color: c.textSecondary }]}>Pay once, fly forever ♾️</Text>
                )}
              </View>
            </View>
            {info.badge ? (
              <View style={[styles.planBadge, { backgroundColor: isSelected ? c.primary : '#6B7280' }]}>
                <Text style={styles.planBadgeText}>{info.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: c.primary }, loading && { opacity: 0.7 }]}
        onPress={handlePurchase}
        disabled={loading}
        activeOpacity={0.8}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.ctaBtnText}>
              Upgrade to Premium — {language === 'hi'
                ? PLAN_DETAILS[selectedPlan].displayPriceHi
                : PLAN_DETAILS[selectedPlan].displayPrice}
            </Text>
        }
      </TouchableOpacity>

      <Text style={[styles.legalText, { color: c.textSecondary }]}>
        Secure payment via Razorpay. No refunds on lifetime plan.
        Trip Pass expires 7 days after purchase.
        By purchasing you agree to our Terms of Service.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },

  // Already premium
  alreadyPremiumCard: {
    margin: 20, borderRadius: 20, padding: 32,
    alignItems: 'center', elevation: 4,
  },
  premiumEmoji: { fontSize: 56, marginBottom: 12 },
  premiumActiveTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  premiumActiveDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },

  // Hero
  hero: {
    paddingVertical: 40, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
  },
  heroDeco1: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroDeco2: { position: 'absolute', bottom: -40, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroEmoji: { fontSize: 52, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },

  // Free Trial Banner
  trialBanner: {
    marginHorizontal: 20, marginTop: 20,
    borderRadius: 16, padding: 16,
    backgroundColor: '#7C3AED',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  trialBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  trialBannerEmoji: { fontSize: 28 },
  trialBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  trialBannerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  trialBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginLeft: 10,
  },
  trialBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Features
  featuresCard: {
    marginHorizontal: 20, marginTop: 20,
    borderRadius: 16, padding: 4,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  featureHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  featureHeaderBlank: { flex: 1.8, fontSize: 12, fontWeight: '700' },
  featureHeaderFree: { flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  featureHeaderPremium: { flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: { fontSize: 18, width: 28 },
  featureInfo: { flex: 1 },
  featureLabel: { fontSize: 13, fontWeight: '600', flex: 1.2 },
  featureFree: { fontSize: 11, flex: 1, textAlign: 'center' },
  featurePremium: { fontSize: 11, flex: 1, textAlign: 'center', fontWeight: '700' },
  featureValue: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Section labels
  sectionLabel: {
    fontSize: 12, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.9, marginHorizontal: 20, marginTop: 20, marginBottom: 8,
  },
  // Free features
  freeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  freeInfo: { flex: 1 },
  freeLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  freeLabelHighlight: { color: '#7C3AED', fontSize: 15 },
  freeDesc: { fontSize: 12, lineHeight: 16 },
  freeTick: { fontSize: 16, color: '#10B981', fontWeight: '800', marginLeft: 8 },
  featureIconHighlight: { fontSize: 24 },

  // Plans
  sectionTitle: { fontSize: 17, fontWeight: '800', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  planCard: {
    marginHorizontal: 20, marginBottom: 10,
    borderRadius: 14, borderWidth: 1.5,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioFill: { width: 12, height: 12, borderRadius: 6 },
  planLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  planPrice: { fontSize: 14, fontWeight: '600' },
  planSubtext: { fontSize: 11, marginTop: 2 },
  planBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  planBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // CTA
  ctaBtn: {
    marginHorizontal: 20, marginTop: 20,
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  legalText: {
    fontSize: 11, lineHeight: 17,
    marginHorizontal: 20, marginTop: 16,
    textAlign: 'center',
  },
});
