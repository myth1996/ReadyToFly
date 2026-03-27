import React, { useRef } from 'react';
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
    phone: '0124-6173838',
    webUrl: 'https://www.goindigo.in/contact-us.html',
  },
  {
    name: 'Air India',
    iataPrefix: 'AI',
    emoji: '🔴',
    color: '#B71C1C',
    phone: '1860-233-1407',
    webUrl: 'https://www.airindia.com/in/en/help-and-support/contact-us.html',
  },
  {
    name: 'SpiceJet',
    iataPrefix: 'SG',
    emoji: '🟠',
    color: '#FF5722',
    phone: '0124-7100333',
    webUrl: 'https://corporate.spicejet.com/ContactUs.aspx',
  },
  {
    name: 'Vistara',
    iataPrefix: 'UK',
    emoji: '🟣',
    color: '#6B21A8',
    phone: '9289228282',
    webUrl: 'https://www.airvistara.com/in/en/contact-us',
  },
  {
    name: 'Air India Express',
    iataPrefix: 'IX',
    emoji: '🔴',
    color: '#C62828',
    phone: '1800-101-6767',
    webUrl: 'https://www.airindiaexpress.com/contact-us',
  },
  {
    name: 'Akasa Air',
    iataPrefix: 'QP',
    emoji: '🟡',
    color: '#D97706',
    phone: '080-6166-5555',
    webUrl: 'https://www.akasaair.com/contact-us',
  },
];

export function AirlineComplaintScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();
  const scrollRef = useRef<ScrollView>(null);

  const nextPrefix = nextFlight?.flightIata?.slice(0, 2)?.toUpperCase() ?? '';
  const sortedAirlines = [...AIRLINES].sort((a, b) => {
    if (a.iataPrefix === nextPrefix) return -1;
    if (b.iataPrefix === nextPrefix) return 1;
    return 0;
  });

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Info Banner ── */}
      <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
        <Text style={styles.infoEmoji}>💡</Text>
        <Text style={styles.infoText}>
          Try the airline first. If unresolved in 15 days, escalate to DGCA/AirSewa.
        </Text>
      </View>

      {nextFlight && (
        <View style={[styles.banner, { backgroundColor: c.primary + '15', borderColor: c.primary + '40' }]}>
          <Text style={styles.bannerEmoji}>✈️</Text>
          <Text style={[styles.bannerText, { color: c.primary }]}>
            {nextFlight.airline} ({nextFlight.flightIata}) shown first
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SELECT AIRLINE</Text>

      {sortedAirlines.map(airline => {
        const isNext = airline.iataPrefix === nextPrefix;
        return (
          <View
            key={airline.name}
            style={[
              styles.airlineCard,
              { backgroundColor: c.card, borderColor: isNext ? c.primary : c.border },
              isNext && { borderWidth: 2 },
            ]}>

            {isNext && (
              <View style={[styles.yourBadge, { backgroundColor: c.primary }]}>
                <Text style={styles.yourBadgeText}>YOUR AIRLINE</Text>
              </View>
            )}

            <View style={styles.airlineTop}>
              <View style={[styles.airlineIcon, { backgroundColor: airline.color + '18' }]}>
                <Text style={{ fontSize: 24 }}>{airline.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.airlineName, { color: c.text }]}>{airline.name}</Text>
                <Text style={[styles.airlineCode, { color: c.textSecondary }]}>
                  {airline.iataPrefix} · {airline.phone}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: '#10B981' }]}
                onPress={() => { haptic.impact(); Linking.openURL(`tel:${airline.phone.replace(/-/g, '')}`); }}>
                <Text style={styles.btnText}>📞 Call Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.webBtn, { backgroundColor: airline.color }]}
                onPress={() => { haptic.selection(); Linking.openURL(airline.webUrl); }}>
                <Text style={styles.btnText}>🌐 File Online</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* ── Escalate to DGCA ── */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: 8 }]}>ESCALATE</Text>

      <TouchableOpacity
        style={styles.dgcaCard}
        onPress={() => { haptic.heavy(); Linking.openURL('https://airsewa.gov.in/site/complaindashboard/index'); }}
        activeOpacity={0.85}>
        <View>
          <Text style={styles.dgcaTitle}>⚖️ DGCA / AirSewa</Text>
          <Text style={styles.dgcaSub}>File with the civil aviation regulator</Text>
          <Text style={styles.dgcaNote}>Use if airline doesn't resolve in 15 days</Text>
        </View>
        <Text style={styles.dgcaArrow}>File →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.consumersCard, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => { haptic.selection(); Linking.openURL('https://consumerhelpline.gov.in/'); }}>
        <View>
          <Text style={[styles.consumersTitle, { color: c.text }]}>🏛️ Consumer Forum</Text>
          <Text style={[styles.consumersSub, { color: c.textSecondary }]}>
            National Consumer Helpline · 1800-11-4000
          </Text>
        </View>
        <Text style={[styles.dgcaArrow, { color: c.primary }]}>→</Text>
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Document everything: booking confirmation, boarding pass, receipts, and all communication.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  infoEmoji: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  bannerEmoji: { fontSize: 16 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  airlineCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, overflow: 'hidden',
  },
  yourBadge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  yourBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  airlineTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  airlineIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  airlineName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  airlineCode: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  webBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dgcaCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dgcaTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  dgcaSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  dgcaNote: { fontSize: 11, color: '#F59E0B' },
  dgcaArrow: { fontSize: 18, fontWeight: '700', color: '#fff' },
  consumersCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  consumersTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  consumersSub: { fontSize: 12 },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
