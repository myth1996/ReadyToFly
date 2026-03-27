import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';
import { haptic } from '../services/HapticService';

const PARTNERS = [
  {
    name: 'PolicyBazaar',
    emoji: '🏦',
    tagline: 'India\'s largest insurance portal',
    fromPrice: '₹149',
    color: '#1B6FE8',
    badge: 'RECOMMENDED',
    url: 'https://www.policybazaar.com/travel-insurance/?utm_source=readytofly',
  },
  {
    name: 'Digit Insurance',
    emoji: '🔢',
    tagline: 'Simple, fast, paperless claims',
    fromPrice: '₹199',
    color: '#7C3AED',
    badge: null,
    url: 'https://www.godigit.com/travel-insurance?utm_source=readytofly',
  },
  {
    name: 'Acko',
    emoji: '🅰️',
    tagline: 'Instant online insurance & claims',
    fromPrice: '₹179',
    color: '#0D9488',
    badge: null,
    url: 'https://www.acko.com/travel-insurance/?utm_source=readytofly',
  },
  {
    name: 'TATA AIG',
    emoji: '⭐',
    tagline: 'Trusted since 2001, global coverage',
    fromPrice: '₹299',
    color: '#1E293B',
    badge: null,
    url: 'https://www.tataaig.com/travel-insurance?utm_source=readytofly',
  },
];

const COVERAGE = [
  { icon: '⏰', title: 'Flight Delay', desc: 'Compensation if delayed 4+ hours' },
  { icon: '❌', title: 'Trip Cancellation', desc: 'Medical or emergency cancellations' },
  { icon: '🏥', title: 'Medical Emergency', desc: 'Hospital bills covered abroad & domestic' },
  { icon: '🧳', title: 'Lost Baggage', desc: 'Compensation for lost or damaged bags' },
  { icon: '🔗', title: 'Missed Connection', desc: 'Missed connecting flights covered' },
  { icon: '📋', title: 'Trip Interruption', desc: 'Cut-short trips reimbursed' },
];

export function InsuranceScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();
  const [coverageOpen, setCoverageOpen] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View style={[styles.hero, { backgroundColor: '#0F172A' }]}>
        <Text style={styles.heroEmoji}>🛡️</Text>
        <Text style={styles.heroTitle}>Travel Insurance</Text>
        <Text style={styles.heroSub}>
          Protect your trip from delays, cancellations & emergencies
        </Text>
        {nextFlight && (
          <View style={styles.heroBanner}>
            <Text style={styles.heroBannerText}>
              ✈️ {nextFlight.flightIata} · {nextFlight.dep.iata} → {nextFlight.arr.iata}
            </Text>
          </View>
        )}
      </View>

      {/* ── Partners ── */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>GET A QUOTE</Text>

      {PARTNERS.map(p => (
        <TouchableOpacity
          key={p.name}
          style={[styles.partnerCard, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => { haptic.impact(); Linking.openURL(p.url); }}
          activeOpacity={0.82}>
          {p.badge && (
            <View style={[styles.badge, { backgroundColor: c.primary }]}>
              <Text style={styles.badgeText}>{p.badge}</Text>
            </View>
          )}
          <View style={styles.partnerTop}>
            <View style={[styles.partnerIcon, { backgroundColor: p.color + '18' }]}>
              <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={[styles.partnerName, { color: c.text }]}>{p.name}</Text>
              <Text style={[styles.partnerTagline, { color: c.textSecondary }]}>{p.tagline}</Text>
            </View>
            <View style={[styles.priceWrap, { backgroundColor: p.color + '15' }]}>
              <Text style={[styles.priceFrom, { color: c.textSecondary }]}>from</Text>
              <Text style={[styles.price, { color: p.color }]}>{p.fromPrice}</Text>
            </View>
          </View>
          <View style={[styles.getQuoteBtn, { backgroundColor: p.color }]}>
            <Text style={styles.getQuoteBtnText}>Get Quote →</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ── What's Covered ── */}
      <TouchableOpacity
        style={[styles.coverageHeader, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => { haptic.selection(); setCoverageOpen(o => !o); }}>
        <Text style={[styles.coverageTitle, { color: c.text }]}>📋 What's Covered?</Text>
        <Text style={[styles.chevron, { color: c.textSecondary }]}>{coverageOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {coverageOpen && (
        <View style={[styles.coverageList, { backgroundColor: c.card, borderColor: c.border }]}>
          {COVERAGE.map(item => (
            <View key={item.title} style={[styles.coverageItem, { borderBottomColor: c.border }]}>
              <Text style={styles.coverageIcon}>{item.icon}</Text>
              <View style={styles.coverageText}>
                <Text style={[styles.coverageItemTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.coverageItemDesc, { color: c.textSecondary }]}>{item.desc}</Text>
              </View>
              <Text style={{ color: '#10B981', fontSize: 16 }}>✓</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        ReadyToFly may earn a commission on purchases. Policy terms & conditions apply.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12 },
  hero: {
    padding: 28, paddingTop: 32, alignItems: 'center',
  },
  heroEmoji: { fontSize: 52, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },
  heroBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  heroBannerText: { color: '#93C5FD', fontSize: 13, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 4,
  },
  partnerCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 12, overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  partnerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  partnerTagline: { fontSize: 12, lineHeight: 16 },
  priceWrap: { borderRadius: 10, padding: 8, alignItems: 'center' },
  priceFrom: { fontSize: 10 },
  price: { fontSize: 18, fontWeight: '900' },
  getQuoteBtn: {
    borderRadius: 10, padding: 12, alignItems: 'center',
  },
  getQuoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  coverageHeader: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  coverageTitle: { fontSize: 15, fontWeight: '700' },
  chevron: { fontSize: 14 },
  coverageList: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  coverageItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  coverageIcon: { fontSize: 20, width: 28 },
  coverageText: { flex: 1 },
  coverageItemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  coverageItemDesc: { fontSize: 12, lineHeight: 16 },
  disclaimer: {
    fontSize: 11, textAlign: 'center',
    marginHorizontal: 16, marginVertical: 12, lineHeight: 16,
  },
});
