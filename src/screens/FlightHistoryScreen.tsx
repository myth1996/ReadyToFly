/**
 * FlightHistoryScreen — Past flights archive
 *
 * Shows all flights whose departure was more than 2 hours ago,
 * sorted by most recent first. Data comes from FlightsContext
 * (backed by Firestore + AsyncStorage).
 */
import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFlights, effectiveDepTime } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { formatISOTime, statusColor, statusLabel } from '../services/FlightService';
import { AIRPORTS } from '../data/airports';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';
import { useAuth } from '../context/AuthContext';

// ─── Single history card ──────────────────────────────────────────────────────

function HistoryCard({ flight, onPress }: {
  flight: ReturnType<typeof useFlights>['flights'][0];
  onPress: () => void;
}) {
  const { themeColors: c } = useSettings();
  const depCity = AIRPORTS[flight.dep.iata]?.city ?? flight.dep.iata;
  const arrCity = AIRPORTS[flight.arr.iata]?.city ?? flight.arr.iata;
  const depDate = flight.dep.scheduledTime
    ? new Date(flight.dep.scheduledTime).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';
  const depTime = formatISOTime(flight.dep.scheduledTime);
  const arrTime = formatISOTime(flight.arr.scheduledTime);
  const color   = statusColor(flight.status);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.75}>
      {/* Top row: airline badge + route + status */}
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={styles.badgeText}>{flight.flightIata.replace(/\d+/, '')}</Text>
        </View>
        <View style={styles.cardMid}>
          <Text style={[styles.flightNum, { color: c.text }]}>{flight.flightIata}</Text>
          <Text style={[styles.airline, { color: c.textSecondary }]}>{flight.airline}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.statusText, { color }]}>{statusLabel(flight.status)}</Text>
        </View>
      </View>

      {/* Route row */}
      <View style={styles.routeRow}>
        <View style={styles.endpoint}>
          <Text style={[styles.iata, { color: c.text }]}>{flight.dep.iata}</Text>
          <Text style={[styles.city, { color: c.textSecondary }]}>{depCity}</Text>
          <Text style={[styles.time, { color: c.textSecondary }]}>{depTime}</Text>
        </View>
        <View style={styles.routeCenter}>
          <Text style={styles.arrow}>✈</Text>
          <Text style={[styles.dateLabel, { color: c.textSecondary }]}>{depDate}</Text>
        </View>
        <View style={[styles.endpoint, styles.endpointRight]}>
          <Text style={[styles.iata, { color: c.text }]}>{flight.arr.iata}</Text>
          <Text style={[styles.city, { color: c.textSecondary }]}>{arrCity}</Text>
          <Text style={[styles.time, { color: c.textSecondary }]}>{arrTime}</Text>
        </View>
      </View>

      {flight.pnr ? (
        <Text style={[styles.pnr, { color: c.textSecondary }]}>PNR: {flight.pnr}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function FlightHistoryScreen() {
  const { themeColors: c } = useSettings();
  const { flights } = useFlights();
  const navigation = useNavigation<any>();
  const { isPremiumUser } = useAuth();

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, null));
    });
    return unsub;
  }, [navigation, isPremiumUser]);

  // Past flights = departed more than 2 h ago
  const pastFlights = useMemo(() => {
    const cutoff = Date.now() - 2 * 3600_000;
    return flights
      .filter(f => new Date(effectiveDepTime(f.dep)).getTime() < cutoff)
      .sort(
        (a, b) =>
          new Date(effectiveDepTime(b.dep)).getTime() -
          new Date(effectiveDepTime(a.dep)).getTime(),
      );
  }, [flights]);

  // Group by month-year
  const grouped = useMemo(() => {
    const map = new Map<string, typeof pastFlights>();
    pastFlights.forEach(f => {
      const d = new Date(f.dep.scheduledTime || Date.now());
      const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!map.has(key)) { map.set(key, []); }
      map.get(key)!.push(f);
    });
    return Array.from(map.entries());
  }, [pastFlights]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      {/* Stats banner */}
      <View style={[styles.statsBanner, { backgroundColor: c.primary }]}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{pastFlights.length}</Text>
          <Text style={styles.statLabel}>Flights</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {new Set(pastFlights.map(f => f.dep.iata)).size +
             new Set(pastFlights.map(f => f.arr.iata)).size}
          </Text>
          <Text style={styles.statLabel}>Airports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {new Set(pastFlights.map(f => f.airline)).size}
          </Text>
          <Text style={styles.statLabel}>Airlines</Text>
        </View>
      </View>

      {pastFlights.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No past flights yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            Flights you've added will appear here once they've departed.
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: c.primary }]}
            onPress={() => { haptic.impact(); navigation.navigate('AddFlight'); }}>
            <Text style={styles.addBtnText}>+ Add Flight</Text>
          </TouchableOpacity>
        </View>
      ) : (
        grouped.map(([month, monthFlights], groupIndex) => (
          <View key={month}>
            <Text style={[styles.monthLabel, { color: c.textSecondary }]}>
              {month.toUpperCase()}
            </Text>
            {monthFlights.map((f, i) => (
              <HistoryCard
                key={`${f.flightIata}-${f.dep.scheduledTime}-${i}`}
                flight={f}
                onPress={() => {
                  haptic.selection();
                  // Navigate to timeline for this flight if possible
                }}
              />
            ))}
            {/* Mid-content banner after 3rd group */}
            {groupIndex === 2 && !isPremiumUser && (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
              </View>
            )}
          </View>
        ))
      )}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },

  statsBanner: { borderRadius: 14, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginBottom: 20 },
  statItem:    { alignItems: 'center', flex: 1 },
  statNum:     { color: '#fff', fontSize: 26, fontWeight: '900' },
  statLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' },

  monthLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },

  card:    { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  badge:        { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  badgeText:    { color: '#fff', fontSize: 13, fontWeight: '900' },
  cardMid:      { flex: 1 },
  flightNum:    { fontSize: 17, fontWeight: '900' },
  airline:      { fontSize: 12, marginTop: 1 },
  statusPill:   { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  routeRow:      { flexDirection: 'row', alignItems: 'center' },
  endpoint:      { flex: 1 },
  endpointRight: { alignItems: 'flex-end' },
  iata:          { fontSize: 22, fontWeight: '900' },
  city:          { fontSize: 11, marginTop: 1 },
  time:          { fontSize: 12, marginTop: 2 },
  routeCenter:   { flex: 1, alignItems: 'center', gap: 4 },
  arrow:         { fontSize: 18, color: '#9CA3AF' },
  dateLabel:     { fontSize: 11, textAlign: 'center' },

  pnr: { fontSize: 11, marginTop: 10 },

  emptyBox:   { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  addBtn:     { borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
