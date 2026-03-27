import React from 'react';
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

const AIRLINES = [
  {
    name: 'IndiGo',
    iataPrefix: '6E',
    emoji: '🔵',
    color: '#1B3FAB',
    trackUrl: 'https://www.goindigo.in/information/baggage/baggage-check.html',
  },
  {
    name: 'Air India',
    iataPrefix: 'AI',
    emoji: '🔴',
    color: '#B71C1C',
    trackUrl: 'https://www.airindia.com/in/en/manage/baggage.html',
  },
  {
    name: 'SpiceJet',
    iataPrefix: 'SG',
    emoji: '🟠',
    color: '#FF5722',
    trackUrl: 'https://www.spicejet.com/',
  },
  {
    name: 'Vistara',
    iataPrefix: 'UK',
    emoji: '🟣',
    color: '#6B21A8',
    trackUrl: 'https://www.airvistara.com/in/en/travel-information/baggage',
  },
  {
    name: 'Air India Express',
    iataPrefix: 'IX',
    emoji: '🔴',
    color: '#C62828',
    trackUrl: 'https://www.airindiaexpress.com/',
  },
  {
    name: 'Akasa Air',
    iataPrefix: 'QP',
    emoji: '🟡',
    color: '#D97706',
    trackUrl: 'https://www.akasaair.com/baggage',
  },
  {
    name: 'Alliance Air',
    iataPrefix: '9I',
    emoji: '⚪',
    color: '#374151',
    trackUrl: 'https://www.allianceair.in/',
  },
  {
    name: 'Star Air',
    iataPrefix: 'S5',
    emoji: '⭐',
    color: '#1E40AF',
    trackUrl: 'https://www.starair.in/',
  },
];

export function BaggageTrackScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();

  // Detect airline from flight IATA prefix
  const nextPrefix = nextFlight?.flightIata?.slice(0, 2)?.toUpperCase() ?? '';
  const sortedAirlines = [...AIRLINES].sort((a, b) => {
    if (a.iataPrefix === nextPrefix) return -1;
    if (b.iataPrefix === nextPrefix) return 1;
    return 0;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Lost Bag Emergency Card ── */}
      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => { haptic.heavy(); Linking.openURL('https://www.worldtracer.aero/filedsp/in.html'); }}
        activeOpacity={0.85}>
        <View style={styles.emergencyLeft}>
          <Text style={styles.emergencyEmoji}>🆘</Text>
          <View>
            <Text style={styles.emergencyTitle}>Lost Your Bag?</Text>
            <Text style={styles.emergencyDesc}>File a report with WorldTracer first</Text>
          </View>
        </View>
        <Text style={styles.emergencyArrow}>File Now →</Text>
      </TouchableOpacity>

      {/* ── Next Flight Pre-selection ── */}
      {nextFlight && (
        <View style={[styles.banner, { backgroundColor: c.primary + '15', borderColor: c.primary + '40' }]}>
          <Text style={styles.bannerEmoji}>✈️</Text>
          <Text style={[styles.bannerText, { color: c.primary }]}>
            Your next flight: {nextFlight.flightIata} — {nextFlight.airline} shown first
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SELECT AIRLINE</Text>

      {sortedAirlines.map(airline => (
        <TouchableOpacity
          key={airline.name}
          style={[styles.airlineCard, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => { haptic.selection(); Linking.openURL(airline.trackUrl); }}
          activeOpacity={0.82}>
          <View style={[styles.airlineIcon, { backgroundColor: airline.color + '18' }]}>
            <Text style={{ fontSize: 24 }}>{airline.emoji}</Text>
          </View>
          <View style={styles.airlineInfo}>
            <Text style={[styles.airlineName, { color: c.text }]}>{airline.name}</Text>
            <Text style={[styles.airlineCode, { color: c.textSecondary }]}>
              {airline.iataPrefix} ·{' '}
              {nextPrefix === airline.iataPrefix ? '⭐ Your airline' : 'Track baggage'}
            </Text>
          </View>
          <View style={[styles.trackBtn, { backgroundColor: airline.color }]}>
            <Text style={styles.trackBtnText}>Track →</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ── Baggage Rules Link ── */}
      <View style={[styles.rulesCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={styles.rulesEmoji}>📏</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rulesTitle, { color: c.text }]}>Baggage Allowances</Text>
          <Text style={[styles.rulesSub, { color: c.textSecondary }]}>
            Check weight limits & cabin rules
          </Text>
        </View>
      </View>

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Tracking links open airline websites. For lost bags always file with WorldTracer within 24 hours.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  emergencyCard: {
    backgroundColor: '#EF4444',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyEmoji: { fontSize: 28 },
  emergencyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emergencyDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  emergencyArrow: { fontSize: 13, fontWeight: '700', color: '#fff' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  bannerEmoji: { fontSize: 16 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4,
  },
  airlineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  airlineIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  airlineInfo: { flex: 1 },
  airlineName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  airlineCode: { fontSize: 12 },
  trackBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rulesCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  rulesEmoji: { fontSize: 24 },
  rulesTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rulesSub: { fontSize: 12 },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
