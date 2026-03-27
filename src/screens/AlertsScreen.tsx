/**
 * AlertsScreen — Live flight alerts hub
 *
 * Shows real-time gate changes, delays, and boarding status
 * for the user's next flight using the polling useFlightStatus hook.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { useFlightStatus } from '../hooks/useFlightStatus';
import { formatISOTime, statusLabel, statusColor, FlightStatus } from '../services/FlightService';
import { AIRPORTS } from '../data/airports';
import { haptic } from '../services/HapticService';

// ─── Pulsing live indicator ────────────────────────────────────────────────────

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);
  return (
    <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
  );
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({ emoji, title, body, highlight }: {
  emoji: string; title: string; body: string; highlight?: boolean;
}) {
  const { themeColors: c } = useSettings();
  return (
    <View style={[
      styles.alertRow,
      { backgroundColor: highlight ? '#FEF3C7' : c.background, borderColor: highlight ? '#F59E0B' : c.border },
    ]}>
      <Text style={styles.alertEmoji}>{emoji}</Text>
      <View style={styles.alertText}>
        <Text style={[styles.alertTitle, { color: highlight ? '#92400E' : c.text }]}>{title}</Text>
        <Text style={[styles.alertBody, { color: highlight ? '#B45309' : c.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AlertsScreen() {
  const { isPremiumUser } = useAuth();
  const { nextFlight } = useFlights();
  const { themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  const { liveData, isLoading, lastUpdated, error, refresh } = useFlightStatus(
    nextFlight?.flightIata ?? null,
  );

  const depCity = nextFlight ? (AIRPORTS[nextFlight.dep.iata]?.city ?? nextFlight.dep.iata) : '';
  const arrCity = nextFlight ? (AIRPORTS[nextFlight.arr.iata]?.city ?? nextFlight.arr.iata) : '';
  const depTime = nextFlight ? formatISOTime(nextFlight.dep.scheduledTime) : '';
  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const flightStatus = (liveData?.status ?? nextFlight?.status ?? '') as FlightStatus;
  const gate      = liveData?.gate ?? nextFlight?.dep.gate ?? '';
  const terminal  = liveData?.terminal ?? nextFlight?.dep.terminal ?? '';
  const statusBg  = flightStatus ? statusColor(flightStatus) : '#6B7280';

  // Build alert items from live data
  const alertItems: { emoji: string; title: string; body: string; highlight: boolean }[] = [];

  if (flightStatus as string) {
    alertItems.push({
      emoji: '✈️',
      title: `Status: ${statusLabel(flightStatus)}`,
      body:  `${nextFlight?.flightIata} · ${depCity} → ${arrCity} · Dep ${depTime}`,
      highlight: flightStatus === 'cancelled' || flightStatus === 'diverted',
    });
  }

  if (gate) {
    alertItems.push({
      emoji: '🚪',
      title: `Gate ${gate}${terminal ? ` · Terminal ${terminal}` : ''}`,
      body:  'Tap "View Gate" on the timeline to navigate there',
      highlight: false,
    });
  }

  if (nextFlight?.dep.delay && nextFlight.dep.delay > 0) {
    alertItems.push({
      emoji: '⏱️',
      title: `Delayed by ${nextFlight.dep.delay} min`,
      body:  liveData?.departureTime
        ? `Updated departure: ${liveData.departureTime} — check timeline`
        : 'Check airline app for updated departure time',
      highlight: true,
    });
  }

  if (liveData?.baggageBelt) {
    alertItems.push({
      emoji: '🧳',
      title: `Baggage Belt ${liveData.baggageBelt}`,
      body:  `Collect bags from Belt ${liveData.baggageBelt} at ${arrCity}`,
      highlight: false,
    });
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>

      {/* ── No flight state ───────────────────────────────────────────── */}
      {!nextFlight ? (
        <>
          <Text style={[styles.heading, { color: c.text }]}>Alerts</Text>
          <Text style={[styles.subheading, { color: c.textSecondary }]}>
            Real-time gate changes, delays & boarding
          </Text>
          <View style={[styles.emptyBox, { backgroundColor: c.card }]}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No active alerts</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              Add an upcoming flight to get instant alerts for gate changes,
              delays over 30 minutes, and when boarding begins.
            </Text>
            <TouchableOpacity
              style={[styles.addFlightBtn, { backgroundColor: c.primary }]}
              onPress={() => { haptic.impact(); navigation.navigate('AddFlight'); }}>
              <Text style={styles.addFlightBtnText}>+ Add Flight</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Flight pill header */}
          <View style={[styles.flightPill, { backgroundColor: c.primary }]}>
            <View style={styles.flightPillLeft}>
              <Text style={styles.flightCode}>{nextFlight.flightIata}</Text>
              <Text style={styles.flightRoute}>{depCity} → {arrCity}  ·  {depTime}</Text>
            </View>
            <View style={styles.flightPillRight}>
              {isLoading
                ? <Text style={styles.liveLabel}>Updating…</Text>
                : (
                  <TouchableOpacity onPress={() => { haptic.selection(); refresh(); }} style={styles.refreshBtn}>
                    <LiveDot />
                    <Text style={styles.liveLabel}>LIVE</Text>
                  </TouchableOpacity>
                )
              }
              {updatedStr && (
                <Text style={styles.updatedAt}>Updated {updatedStr}</Text>
              )}
            </View>
          </View>

          {/* Status badge */}
          {flightStatus ? (
            <View style={[styles.statusBadge, { backgroundColor: statusBg + '22', borderColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusBg }]}>
                {statusLabel(flightStatus)}
              </Text>
            </View>
          ) : null}

          {/* Alert items */}
          {alertItems.length > 0 ? (
            <View style={styles.alertsList}>
              {alertItems.map((a, i) => (
                <AlertRow key={i} {...a} />
              ))}
            </View>
          ) : (
            <View style={[styles.quietCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={styles.quietEmoji}>✅</Text>
              <Text style={[styles.quietTitle, { color: c.text }]}>All clear</Text>
              <Text style={[styles.quietSub, { color: c.textSecondary }]}>
                No alerts right now. We're monitoring your flight and will notify you the moment anything changes.
              </Text>
            </View>
          )}

          {error && (
            <Text style={[styles.errorText, { color: '#EF4444' }]}>
              ⚠️ Could not refresh live data — showing last known info
            </Text>
          )}
        </>
      )}

      {/* ── What triggers an alert ────────────────────────────────────── */}
      <View style={[styles.infoCard, { backgroundColor: c.card }]}>
        <Text style={[styles.infoTitle, { color: c.text }]}>You'll be notified about:</Text>
        {[
          '🚪 Gate assignment or change',
          '⏱️ Delays longer than 30 minutes',
          '📢 Boarding has started',
          '✅ Flight on-time confirmation',
          '🛬 Your flight has landed',
        ].map(item => (
          <Text key={item} style={[styles.infoItem, { color: c.textSecondary }]}>{item}</Text>
        ))}
        <Text style={[styles.infoNote, { color: c.textSecondary }]}>
          Notifications are sent automatically — even when the app is in the background.
        </Text>
      </View>

      {/* ── Banner Ad ─────────────────────────────────────────────────── */}
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
  content:   { padding: 20, paddingBottom: 40 },

  heading:    { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 24 },

  emptyBox:       { alignItems: 'center', borderRadius: 16, padding: 32, marginBottom: 20 },
  emptyIcon:      { fontSize: 48, marginBottom: 14 },
  emptyTitle:     { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  emptyDesc:      { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  addFlightBtn:   { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  addFlightBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  flightPill:      { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flightPillLeft:  { flex: 1 },
  flightCode:      { color: '#fff', fontSize: 22, fontWeight: '900' },
  flightRoute:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  flightPillRight: { alignItems: 'flex-end' },
  refreshBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveLabel:       { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  updatedAt:       { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },

  statusBadge:     { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 12, alignItems: 'center' },
  statusText:      { fontSize: 14, fontWeight: '800' },

  alertsList: { gap: 8, marginBottom: 16 },
  alertRow:   { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 14 },
  alertEmoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  alertText:  { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  alertBody:  { fontSize: 12, lineHeight: 17 },

  quietCard:  { alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 24, marginBottom: 16 },
  quietEmoji: { fontSize: 40, marginBottom: 10 },
  quietTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  quietSub:   { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  errorText:  { fontSize: 12, textAlign: 'center', marginBottom: 12 },

  infoCard:  { borderRadius: 12, padding: 18, marginBottom: 16 },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoItem:  { fontSize: 14, marginBottom: 8, lineHeight: 22 },
  infoNote:  { fontSize: 12, lineHeight: 18, marginTop: 6, fontStyle: 'italic' },
});
