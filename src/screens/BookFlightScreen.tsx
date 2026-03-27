import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';
import { haptic } from '../services/HapticService';

function isoToYYYYMMDD(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  } catch {
    return '';
  }
}

function isoToDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

const PARTNERS = [
  {
    name: 'EaseMyTrip',
    emoji: '🟠',
    tagline: 'Best for IndiGo & SpiceJet',
    color: '#FF6B00',
    buildUrl: (from: string, to: string, yyyymmdd: string, n: number) =>
      `https://www.easemytrip.com/flights/search?src=${from}&dst=${to}&depDate=${yyyymmdd}&pax=${n}-0-0`,
  },
  {
    name: 'MakeMyTrip',
    emoji: '🔴',
    tagline: 'Cashback & holiday packages',
    color: '#D0021B',
    buildUrl: (from: string, to: string, yyyymmdd: string, n: number) =>
      `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${yyyymmdd}&tripType=O&paxType=A-${n}_C-0_I-0&intl=false&cabin=E`,
  },
  {
    name: 'Skyscanner',
    emoji: '🔵',
    tagline: 'Global price comparison',
    color: '#0770E3',
    buildUrl: (from: string, to: string, yyyymmdd: string, n: number) =>
      `https://www.skyscanner.co.in/transport/flights/${from}/${to}/${yyyymmdd}/?adults=${n}`,
  },
  {
    name: 'Ixigo',
    emoji: '🟢',
    tagline: 'Train + Flight combos',
    color: '#FF5722',
    buildUrl: (from: string, to: string, yyyymmdd: string, n: number) =>
      `https://www.ixigo.com/search/result/flight?from=${from}&to=${to}&date=${yyyymmdd}&adults=${n}&children=0&infants=0&class=e&source=Search`,
  },
];

export function BookFlightScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();

  const defaultFrom = nextFlight?.dep?.iata ?? '';
  const defaultTo = nextFlight?.arr?.iata ?? '';
  const defaultDate = nextFlight?.dep?.scheduledTime
    ? isoToDisplay(nextFlight.dep.scheduledTime)
    : isoToDisplay(new Date().toISOString());

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [dateDisplay, setDateDisplay] = useState(defaultDate);
  const [passengers, setPassengers] = useState(1);

  const parseDateToYYYYMMDD = (): string => {
    // Accept both "DD MMM YYYY" and raw ISO
    try {
      const parts = dateDisplay.split(' ');
      if (parts.length === 3) {
        const months: Record<string, string> = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        };
        const day = parts[0].padStart(2, '0');
        const mon = months[parts[1]] ?? '01';
        const yr = parts[2];
        return `${yr}${mon}${day}`;
      }
      return isoToYYYYMMDD(dateDisplay);
    } catch {
      return isoToYYYYMMDD(new Date().toISOString());
    }
  };

  const handleSearch = (partner: typeof PARTNERS[number]) => {
    haptic.impact();
    const f = from.trim().toUpperCase() || 'DEL';
    const t = to.trim().toUpperCase() || 'BOM';
    const d = parseDateToYYYYMMDD() || isoToYYYYMMDD(new Date().toISOString());
    const url = partner.buildUrl(f, t, d, passengers);
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {/* ── Pre-fill Banner ── */}
      {nextFlight && (
        <View style={[styles.banner, { backgroundColor: c.primary + '15', borderColor: c.primary + '40' }]}>
          <Text style={styles.bannerEmoji}>✈️</Text>
          <Text style={[styles.bannerText, { color: c.primary }]}>
            Pre-filled from {nextFlight.flightIata} · {nextFlight.dep.iata} → {nextFlight.arr.iata}
          </Text>
        </View>
      )}

      {/* ── Search Form ── */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Search Flights</Text>

        <View style={styles.routeRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>FROM</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              value={from}
              onChangeText={t => setFrom(t.toUpperCase())}
              placeholder="DEL"
              placeholderTextColor={c.textSecondary}
              maxLength={3}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.swapBtn, { backgroundColor: c.primary + '20' }]}
            onPress={() => { haptic.selection(); setFrom(to); setTo(from); }}>
            <Text style={{ color: c.primary, fontSize: 18 }}>⇄</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>TO</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              value={to}
              onChangeText={t => setTo(t.toUpperCase())}
              placeholder="BOM"
              placeholderTextColor={c.textSecondary}
              maxLength={3}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>DATE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              value={dateDisplay}
              onChangeText={setDateDisplay}
              placeholder="28 Mar 2025"
              placeholderTextColor={c.textSecondary}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>PASSENGERS</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: c.border }]}
                onPress={() => { haptic.selection(); setPassengers(p => Math.max(1, p - 1)); }}>
                <Text style={[styles.stepBtnText, { color: c.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: c.text }]}>{passengers}</Text>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: c.border }]}
                onPress={() => { haptic.selection(); setPassengers(p => Math.min(9, p + 1)); }}>
                <Text style={[styles.stepBtnText, { color: c.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── Partner Buttons ── */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SEARCH ON</Text>

      {PARTNERS.map(p => (
        <TouchableOpacity
          key={p.name}
          style={[styles.partnerBtn, { backgroundColor: p.color }]}
          onPress={() => handleSearch(p)}
          activeOpacity={0.82}>
          <View style={styles.partnerLeft}>
            <Text style={styles.partnerEmoji}>{p.emoji}</Text>
            <View>
              <Text style={styles.partnerName}>{p.name}</Text>
              <Text style={styles.partnerTagline}>{p.tagline}</Text>
            </View>
          </View>
          <Text style={styles.partnerArrow}>Search →</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Prices shown by partners. ReadyToFly may earn a commission on bookings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  bannerEmoji: { fontSize: 18 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 16, fontWeight: '700',
  },
  swapBtn: {
    width: 40, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 0,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 32, height: 44, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '600' },
  stepValue: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    marginTop: 8, marginBottom: 4,
  },
  partnerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 16, marginBottom: 8,
  },
  partnerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerEmoji: { fontSize: 24 },
  partnerName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  partnerTagline: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  partnerArrow: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
