import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';

// Time period based on current hour (IST)
function getTimePeriod(hour: number): 'morning_rush' | 'midday' | 'evening_rush' | 'night' {
  if (hour >= 4 && hour < 10) return 'morning_rush';
  if (hour >= 10 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 23) return 'evening_rush';
  return 'night';
}

const PERIOD_LABEL: Record<string, { label: string; emoji: string; desc: string }> = {
  morning_rush: { label: 'Morning Rush', emoji: '🌅', desc: '04:00 – 10:00 · Busiest period' },
  midday:       { label: 'Afternoon',    emoji: '☀️',  desc: '10:00 – 16:00 · Moderate traffic' },
  evening_rush: { label: 'Evening Rush', emoji: '🌆', desc: '16:00 – 23:00 · High traffic' },
  night:        { label: 'Late Night',   emoji: '🌙',  desc: '23:00 – 04:00 · Light traffic' },
};

// Wait times in minutes [min, max] per period and category
type WaitData = {
  security: [number, number];
  checkin: [number, number];
  immigration?: [number, number]; // international airports only
};

type PeriodWaits = Record<'morning_rush' | 'midday' | 'evening_rush' | 'night', WaitData>;

const AIRPORTS: Array<{
  iata: string;
  name: string;
  city: string;
  international: boolean;
  waits: PeriodWaits;
}> = [
  {
    iata: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', international: true,
    waits: {
      morning_rush: { security: [20, 40], checkin: [25, 50], immigration: [15, 35] },
      midday:       { security: [10, 20], checkin: [10, 25], immigration: [10, 20] },
      evening_rush: { security: [25, 45], checkin: [20, 40], immigration: [20, 40] },
      night:        { security: [5,  15], checkin: [5,  15], immigration: [5,  15] },
    },
  },
  {
    iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', international: true,
    waits: {
      morning_rush: { security: [25, 45], checkin: [20, 40], immigration: [15, 30] },
      midday:       { security: [10, 25], checkin: [10, 20], immigration: [10, 20] },
      evening_rush: { security: [20, 40], checkin: [20, 35], immigration: [15, 30] },
      night:        { security: [5,  15], checkin: [5,  15], immigration: [5,  15] },
    },
  },
  {
    iata: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', international: true,
    waits: {
      morning_rush: { security: [20, 35], checkin: [20, 35], immigration: [10, 25] },
      midday:       { security: [10, 20], checkin: [10, 20], immigration: [8,  18] },
      evening_rush: { security: [20, 38], checkin: [15, 30], immigration: [10, 25] },
      night:        { security: [5,  12], checkin: [5,  12], immigration: [5,  12] },
    },
  },
  {
    iata: 'MAA', name: 'Chennai Intl', city: 'Chennai', international: true,
    waits: {
      morning_rush: { security: [15, 30], checkin: [15, 30], immigration: [10, 25] },
      midday:       { security: [8,  18], checkin: [8,  18], immigration: [8,  18] },
      evening_rush: { security: [15, 32], checkin: [15, 28], immigration: [10, 22] },
      night:        { security: [5,  12], checkin: [5,  12], immigration: [5,  12] },
    },
  },
  {
    iata: 'CCU', name: 'Netaji Subhas Chandra Bose Intl', city: 'Kolkata', international: true,
    waits: {
      morning_rush: { security: [15, 30], checkin: [15, 30], immigration: [10, 22] },
      midday:       { security: [8,  18], checkin: [8,  18], immigration: [8,  18] },
      evening_rush: { security: [15, 28], checkin: [12, 25], immigration: [10, 20] },
      night:        { security: [5,  10], checkin: [5,  10], immigration: [5,  10] },
    },
  },
  {
    iata: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', international: true,
    waits: {
      morning_rush: { security: [15, 30], checkin: [15, 28], immigration: [10, 22] },
      midday:       { security: [8,  18], checkin: [8,  18], immigration: [8,  16] },
      evening_rush: { security: [15, 30], checkin: [12, 25], immigration: [10, 20] },
      night:        { security: [5,  12], checkin: [5,  12], immigration: [5,  12] },
    },
  },
  {
    iata: 'COK', name: 'Cochin Intl', city: 'Kochi', international: true,
    waits: {
      morning_rush: { security: [12, 25], checkin: [12, 25], immigration: [10, 20] },
      midday:       { security: [8,  15], checkin: [8,  15], immigration: [8,  15] },
      evening_rush: { security: [12, 25], checkin: [10, 22], immigration: [8,  18] },
      night:        { security: [5,  10], checkin: [5,  10], immigration: [5,  10] },
    },
  },
  {
    iata: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', international: false,
    waits: {
      morning_rush: { security: [12, 25], checkin: [12, 25] },
      midday:       { security: [8,  15], checkin: [8,  15] },
      evening_rush: { security: [12, 22], checkin: [10, 20] },
      night:        { security: [5,  10], checkin: [5,  10] },
    },
  },
];

function waitColor(min: number, max: number): string {
  const avg = (min + max) / 2;
  if (avg <= 15) return '#10B981'; // green
  if (avg <= 30) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

function waitLabel(min: number, max: number): string {
  return `${min}–${max} min`;
}

export function WaitingTimeScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();

  // Use IST time
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const period = getTimePeriod(now.getHours());
  const periodInfo = PERIOD_LABEL[period];

  // Sort: put next flight's departure airport first
  const depIata = nextFlight?.dep?.iata;
  const sorted = [...AIRPORTS].sort((a, b) => {
    if (a.iata === depIata) return -1;
    if (b.iata === depIata) return 1;
    return 0;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Period Banner ── */}
      <View style={[styles.periodCard, { backgroundColor: '#0F172A' }]}>
        <Text style={styles.periodEmoji}>{periodInfo.emoji}</Text>
        <View>
          <Text style={styles.periodLabel}>{periodInfo.label}</Text>
          <Text style={styles.periodDesc}>{periodInfo.desc}</Text>
        </View>
        <View style={styles.timeWrap}>
          <Text style={styles.timeText}>
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
          <Text style={styles.timeZone}>IST</Text>
        </View>
      </View>

      {/* ── Legend ── */}
      <View style={[styles.legend, { backgroundColor: c.card, borderColor: c.border }]}>
        {[['#10B981', '< 15 min'], ['#F59E0B', '15–30 min'], ['#EF4444', '> 30 min']].map(([col, lbl]) => (
          <View key={lbl} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: col }]} />
            <Text style={[styles.legendText, { color: c.textSecondary }]}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* ── Airports ── */}
      {sorted.map(airport => {
        const w = airport.waits[period];
        const isNext = airport.iata === depIata;
        return (
          <View
            key={airport.iata}
            style={[
              styles.airportCard,
              { backgroundColor: c.card, borderColor: isNext ? c.primary : c.border },
              isNext && { borderWidth: 2 },
            ]}>
            {isNext && (
              <View style={[styles.nextBadge, { backgroundColor: c.primary }]}>
                <Text style={styles.nextBadgeText}>YOUR DEPARTURE</Text>
              </View>
            )}

            <View style={styles.airportHeader}>
              <View>
                <Text style={[styles.airportIata, { color: c.primary }]}>{airport.iata}</Text>
                <Text style={[styles.airportName, { color: c.text }]}>{airport.city}</Text>
                <Text style={[styles.airportFull, { color: c.textSecondary }]}>{airport.name}</Text>
              </View>
              {airport.international && (
                <View style={[styles.intlBadge, { backgroundColor: c.primary + '20' }]}>
                  <Text style={[styles.intlBadgeText, { color: c.primary }]}>INTL</Text>
                </View>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: c.border }]} />

            <View style={styles.waitGrid}>
              <View style={styles.waitItem}>
                <Text style={[styles.waitCategory, { color: c.textSecondary }]}>🔒 Security</Text>
                <Text style={[styles.waitTime, { color: waitColor(w.security[0], w.security[1]) }]}>
                  {waitLabel(w.security[0], w.security[1])}
                </Text>
              </View>
              <View style={styles.waitItem}>
                <Text style={[styles.waitCategory, { color: c.textSecondary }]}>🎟️ Check-in</Text>
                <Text style={[styles.waitTime, { color: waitColor(w.checkin[0], w.checkin[1]) }]}>
                  {waitLabel(w.checkin[0], w.checkin[1])}
                </Text>
              </View>
              {w.immigration && (
                <View style={styles.waitItem}>
                  <Text style={[styles.waitCategory, { color: c.textSecondary }]}>🛂 Immigration</Text>
                  <Text style={[styles.waitTime, { color: waitColor(w.immigration[0], w.immigration[1]) }]}>
                    {waitLabel(w.immigration[0], w.immigration[1])}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Estimates based on typical patterns. Actual wait times may vary. Check airport website for real-time info.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  periodCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  periodEmoji: { fontSize: 32 },
  periodLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },
  periodDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  timeWrap: { marginLeft: 'auto', alignItems: 'flex-end' },
  timeText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  timeZone: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  legend: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  airportCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: 'hidden',
  },
  nextBadge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  nextBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  airportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  airportIata: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  airportName: { fontSize: 15, fontWeight: '700' },
  airportFull: { fontSize: 11, marginTop: 2 },
  intlBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  intlBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth },
  waitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  waitItem: { flex: 1, minWidth: '30%' },
  waitCategory: { fontSize: 11, marginBottom: 4 },
  waitTime: { fontSize: 15, fontWeight: '800' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
