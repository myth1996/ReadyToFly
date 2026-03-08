import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { purchasePremium, PLAN_DETAILS, PremiumPlan } from '../services/PaymentService';
import { haptic } from '../services/HapticService';

const FEATURES_LIST = [
  { icon: '✈️', label: 'Unlimited flight tracking', free: '3 flights max', premium: 'Unlimited' },
  { icon: '🚫', label: 'No advertisements', free: 'Ads shown', premium: 'Ad-free experience' },
  { icon: '🔔', label: 'Priority flight alerts', free: 'Standard alerts', premium: 'Instant push alerts' },
  { icon: '😌', label: 'Calm Mode', free: '🔒 Locked', premium: 'Full access' },
  { icon: '📋', label: 'Doc Checklist templates', free: 'Basic', premium: 'Custom templates' },
  { icon: '🗺️', label: 'Airport Guide', free: 'Full access', premium: 'Full access' },
  { icon: '🧳', label: 'Baggage Rules', free: 'Full access', premium: 'Full access' },
];

export function PremiumScreen() {
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c, language } = useSettings();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>('yearly');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) { return; }
    haptic.impact();
    setLoading(true);
    try {
      await purchasePremium(selectedPlan, user.uid, user.phoneNumber ?? '');
    } finally {
      setLoading(false);
    }
  };

  if (isPremiumUser) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
        <View style={[styles.alreadyPremiumCard, { backgroundColor: c.primary }]}>
          <Text style={styles.premiumEmoji}>👑</Text>
          <Text style={styles.premiumActiveTitle}>You're Premium!</Text>
          <Text style={styles.premiumActiveDesc}>
            You have full access to all FlyEasy features. Thank you for your support!
          </Text>
        </View>
        <View style={[styles.featuresCard, { backgroundColor: c.card }]}>
          {FEATURES_LIST.map(f => (
            <View key={f.label} style={[styles.featureRow, { borderBottomColor: c.border }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
                <Text style={[styles.featureValue, { color: '#10B981' }]}>✓ {f.premium}</Text>
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
        <Text style={styles.heroTitle}>FlyEasy Premium</Text>
        <Text style={styles.heroSubtitle}>Fly smarter. Worry less.</Text>
      </View>

      {/* Feature comparison */}
      <View style={[styles.featuresCard, { backgroundColor: c.card }]}>
        <View style={styles.featureHeader}>
          <Text style={[styles.featureHeaderBlank, { color: c.text }]}>Feature</Text>
          <Text style={[styles.featureHeaderFree, { color: c.textSecondary }]}>Free</Text>
          <Text style={[styles.featureHeaderPremium, { color: c.primary }]}>Premium</Text>
        </View>
        {FEATURES_LIST.map((f, i) => (
          <View
            key={f.label}
            style={[
              styles.featureRow,
              { borderBottomColor: c.border },
              i === FEATURES_LIST.length - 1 && { borderBottomWidth: 0 },
            ]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: c.text }]}>{f.label}</Text>
            <Text style={[styles.featureFree, { color: f.free.startsWith('🔒') ? '#EF4444' : c.textSecondary }]}>{f.free}</Text>
            <Text style={[styles.featurePremium, { color: '#10B981' }]}>✓ {f.premium}</Text>
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
        Secure payment via Razorpay. Cancel anytime for monthly/yearly plans.
        No refunds on lifetime plan. By purchasing you agree to our Terms of Service.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },

  // Already premium
  alreadyPremiumCard: {
    margin: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    elevation: 4,
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

  // Plans
  sectionTitle: { fontSize: 17, fontWeight: '800', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  planCard: {
    marginHorizontal: 20, marginBottom: 10,
    borderRadius: 14, borderWidth: 1.5,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioFill: { width: 12, height: 12, borderRadius: 6 },
  planLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  planPrice: { fontSize: 14, fontWeight: '600' },
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
