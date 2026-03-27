/**
 * FlightTimelineScreen — 7-stage journey progress hub
 *
 * NEW HOME SCREEN. Replaces TripDashboard as the root of HomeStack.
 * Shows the full pre-flight journey from home to landed.
 * Each stage has a tap action linking to the relevant feature.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlights, getCountdown, effectiveDepTime } from '../context/FlightsContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useFlightStatus } from '../hooks/useFlightStatus';
import { notificationService, getCheckInInfo } from '../services/NotificationService';
import { formatISOTime } from '../services/FlightService';
import { AIRPORTS } from '../data/airports';
import { HomeStackParamList } from '../navigation/HomeStack';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'FlightTimeline'>;

// ─── Stage definitions ────────────────────────────────────────────────────────

type StageId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Stage {
  id: StageId;
  emoji: string;
  label: string;
  sublabel: string;
  actionLabel: string;
}

const STAGES: Stage[] = [
  { id: 0, emoji: '🏠', label: 'At Home',          sublabel: 'Prepare & pack',          actionLabel: 'View Checklist' },
  { id: 1, emoji: '🚕', label: 'Cab to Airport',   sublabel: 'Book your ride',           actionLabel: 'Compare Cabs' },
  { id: 2, emoji: '🛫', label: 'At Airport',        sublabel: 'Check-in & security',      actionLabel: 'Web Check-In' },
  { id: 3, emoji: '🛂', label: 'Security Done',     sublabel: 'Head to gate',             actionLabel: 'View Gate' },
  { id: 4, emoji: '🚪', label: 'Boarding',          sublabel: 'Boarding now',             actionLabel: 'Calm Mode' },
  { id: 5, emoji: '✈️', label: 'In Flight',          sublabel: 'Sit back & relax',        actionLabel: 'Calm Mode' },
  { id: 6, emoji: '🏁', label: 'Landed',            sublabel: 'Welcome to destination!',  actionLabel: 'Arrival Info' },
];

// ─── Pulsing dot ──────────────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.pulseDot, { backgroundColor: color, transform: [{ scale }] }]} />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { themeColors: c } = useSettings();
  return (
    <View style={[styles.emptyWrap, { backgroundColor: c.background }]}>
      <Text style={styles.emptyEmoji}>✈️</Text>
      <Text style={[styles.emptyTitle, { color: c.text }]}>No flight yet</Text>
      <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
        Add your flight to start your journey timeline
      </Text>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={onAdd}>
        <Text style={styles.addBtnText}>+ Add Flight</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function FlightTimelineScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();

  const [currentStage, setCurrentStage] = useState<StageId>(0);
  const [countdownText, setCountdownText] = useState('');

  // Live status polling
  const { liveData, isLanded } = useFlightStatus(
    nextFlight?.flightIata ?? null,
    {
      onGateChange: (newGate) => {
        notificationService.sendGateChangeNotification(
          nextFlight?.flightIata ?? '',
          newGate,
          liveData?.terminal,
        ).catch(() => {});
        Alert.alert('⚠️ Gate Changed!', `${nextFlight?.flightIata} is now departing from Gate ${newGate}`);
      },
      onLanding: () => {
        navigation.navigate('LandedConfirmation', {
          arrIata: nextFlight?.arr.iata ?? '',
          flightIata: nextFlight?.flightIata ?? '',
        });
      },
    },
  );

  // Advance stage to Landed when detected
  useEffect(() => {
    if (isLanded) { setCurrentStage(6); }
  }, [isLanded]);

  // Show interstitial each time user lands on home screen (3-min cooldown)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, nextFlight));
    });
    return unsub;
  }, [navigation, isPremiumUser, nextFlight]);

  // Live countdown ticker
  useEffect(() => {
    if (!nextFlight) { return; }
    const update = () => {
      const effDep = effectiveDepTime(nextFlight.dep);
      const cd = getCountdown(effDep);
      setCountdownText(cd.text);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [nextFlight]);

  const handleStageAction = useCallback((stage: Stage) => {
    haptic.impact();
    switch (stage.id) {
      case 0: navigation.navigate('DocChecklist'); break;
      case 1: navigation.navigate('CabCompare', { direction: 'to_airport', airportIata: nextFlight?.dep.iata ?? 'DEL' }); break;
      case 2: {
        const info = nextFlight ? getCheckInInfo(nextFlight.airline, nextFlight.flightIata) : null;
        if (info) {
          Linking.openURL(info.url).catch(() =>
            Alert.alert('Could not open browser', 'Please visit the airline website directly.')
          );
        } else {
          Alert.alert('Web Check-In', 'Check-in page not available for your airline. Please visit their website directly.');
        }
        break;
      }
      case 3:
      case 4:
        navigation.navigate('CalmMode');
        break;
      case 5: navigation.navigate('CalmMode'); break;
      case 6: navigation.navigate('Arrival', { flightIata: nextFlight?.flightIata ?? '', arrIata: nextFlight?.arr.iata ?? '' }); break;
    }
  }, [navigation, nextFlight]);

  const advanceStage = useCallback((stageId: StageId) => {
    haptic.selection();
    setCurrentStage(stageId);
  }, []);

  if (!nextFlight) {
    return <EmptyState onAdd={() => navigation.navigate('AddFlight')} />;
  }

  const effDep = effectiveDepTime(nextFlight.dep);
  const depTime = formatISOTime(effDep);
  const arrTime = formatISOTime(nextFlight.arr.scheduledTime);
  const depCity = AIRPORTS[nextFlight.dep.iata]?.city ?? nextFlight.dep.iata;
  const arrCity = AIRPORTS[nextFlight.arr.iata]?.city ?? nextFlight.arr.iata;
  const gate    = liveData?.gate ?? nextFlight.dep.gate;
  const terminal = liveData?.terminal ?? nextFlight.dep.terminal;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>

      {/* ── Header card ─────────────────────────────────────────────── */}
      <View style={[styles.headerCard, { backgroundColor: c.primary }]}>
        <Text style={styles.flightCode}>{nextFlight.flightIata}</Text>
        <Text style={styles.route}>{depCity} → {arrCity}</Text>
        <View style={styles.headerRow}>
          <View style={styles.headerTime}>
            <Text style={styles.headerTimeLabel}>DEP</Text>
            <Text style={styles.headerTimeValue}>{depTime}</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownLabel}>DEPARTS IN</Text>
            <Text style={styles.countdownText}>{countdownText || '--'}</Text>
          </View>
          <View style={styles.headerTime}>
            <Text style={styles.headerTimeLabel}>ARR</Text>
            <Text style={styles.headerTimeValue}>{arrTime}</Text>
          </View>
        </View>

        {/* Gate badge */}
        {(gate || terminal) && (
          <View style={styles.gateBadge}>
            {terminal && <Text style={styles.gateText}>Terminal {terminal}</Text>}
            {gate     && <Text style={styles.gateText}>  ·  Gate {gate}</Text>}
            {liveData  && <Text style={styles.liveDot}>  🟢 LIVE</Text>}
          </View>
        )}
      </View>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <View style={styles.timelineWrap}>
        {STAGES.map((stage, idx) => {
          const isPast    = stage.id < currentStage;
          const isCurrent = stage.id === currentStage;
          const isFuture  = stage.id > currentStage;

          const stageColor = isPast ? '#10B981' : isCurrent ? c.primary : c.border;

          return (
            <View key={stage.id} style={styles.stageRow}>
              {/* Vertical connector line */}
              {idx < STAGES.length - 1 && (
                <View style={[styles.connector, { backgroundColor: stage.id < currentStage ? '#10B981' : c.border }]} />
              )}

              {/* Stage indicator */}
              <TouchableOpacity
                onPress={() => advanceStage(stage.id as StageId)}
                style={styles.stageLeft}
                activeOpacity={0.7}>
                <View style={[
                  styles.stageCircle,
                  { borderColor: stageColor, backgroundColor: isPast ? '#10B981' : isCurrent ? c.primary + '18' : c.card },
                ]}>
                  {isCurrent
                    ? <PulsingDot color={c.primary} />
                    : <Text style={styles.stageEmoji}>{isPast ? '✓' : stage.emoji}</Text>
                  }
                </View>
              </TouchableOpacity>

              {/* Stage info */}
              <View style={[
                styles.stageCard,
                { backgroundColor: isCurrent ? c.primary + '12' : c.card, borderColor: isCurrent ? c.primary : c.border },
              ]}>
                <View style={styles.stageCardTop}>
                  <View style={styles.stageTextWrap}>
                    <Text style={[
                      styles.stageLabel,
                      { color: isFuture ? c.textSecondary : c.text },
                      isCurrent && { color: c.primary, fontWeight: '800' },
                    ]}>
                      {stage.emoji}  {stage.label}
                    </Text>
                    <Text style={[styles.stageSub, { color: c.textSecondary }]}>
                      {stage.sublabel}
                    </Text>
                  </View>

                  {isCurrent && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: c.primary }]}
                      onPress={() => handleStageAction(stage)}>
                      <Text style={styles.actionBtnText}>{stage.actionLabel}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Quick actions row ─────────────────────────────────────────── */}
      <View style={[styles.quickRow]}>
        {[
          { emoji: '📋', label: 'Checklist',   onPress: () => navigation.navigate('DocChecklist') },
          { emoji: '🧳', label: 'Baggage',      onPress: () => navigation.navigate('BaggageRules') },
          { emoji: '😌', label: 'Calm Mode',    onPress: () => navigation.navigate('CalmMode') },
          { emoji: '🛡️', label: 'Safe Landing', onPress: () => navigation.navigate('LandedSafelySetup') },
        ].map(q => (
          <TouchableOpacity
            key={q.label}
            style={[styles.quickBtn, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => { haptic.selection(); q.onPress(); }}>
            <Text style={styles.quickEmoji}>{q.emoji}</Text>
            <Text style={[styles.quickLabel, { color: c.textSecondary }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Second quick actions row ──────────────────────────────────── */}
      <View style={[styles.quickRow, { marginTop: 8 }]}>
        {[
          { emoji: '👥', label: 'Co-Travel',  onPress: () => navigation.navigate('CoTraveller') },
          { emoji: '🗂️', label: 'Vault',       onPress: () => navigation.navigate('TripVault') },
          { emoji: '✈️✈️', label: 'Multi-Leg',  onPress: () => navigation.navigate('MultiLeg') },
          { emoji: '🗺️', label: 'Airport Map', onPress: () => nextFlight
            ? navigation.navigate('AirportMap', { airportIata: nextFlight.dep.iata })
            : Alert.alert('Add a flight first') },
        ].map(q => (
          <TouchableOpacity
            key={q.label}
            style={[styles.quickBtn, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => { haptic.selection(); q.onPress(); }}>
            <Text style={styles.quickEmoji}>{q.emoji}</Text>
            <Text style={[styles.quickLabel, { color: c.textSecondary }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Travel Insurance affiliate card ──────────────────────────── */}
      {nextFlight && (
        <TouchableOpacity
          style={[styles.insuranceCard, { backgroundColor: '#FFF7ED', borderColor: '#FB923C' }]}
          onPress={() => {
            haptic.selection();
            Linking.openURL('https://www.godigit.com/travel-insurance');
          }}
          activeOpacity={0.8}>
          <View style={styles.insuranceLeft}>
            <Text style={styles.insuranceEmoji}>🛡️</Text>
            <View style={styles.insuranceText}>
              <Text style={styles.insuranceTitle}>Travel Insurance</Text>
              <Text style={styles.insuranceSub}>
                From ₹99 · Covers delays, baggage loss, medical emergencies
              </Text>
              <View style={styles.insuranceBadge}>
                <Text style={styles.insuranceBadgeText}>Powered by Digit Insurance</Text>
              </View>
            </View>
          </View>
          <Text style={styles.insuranceChevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── View Full Dashboard ───────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.dashboardLink, { borderColor: c.border }]}
        onPress={() => navigation.navigate('TripDashboard')}>
        <Text style={[styles.dashboardLinkText, { color: c.textSecondary }]}>
          View Full Flight Dashboard  ›
        </Text>
      </TouchableOpacity>

      {/* ── Banner Ad ─────────────────────────────────────────────── */}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { paddingBottom: 40 },

  // Empty state
  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 500 },
  emptyEmoji:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  addBtn:        { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  addBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Header card
  headerCard:     { margin: 16, borderRadius: 16, padding: 20, elevation: 4 },
  flightCode:     { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  route:          { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', marginTop: 2, marginBottom: 14 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTime:     { alignItems: 'center' },
  headerTimeLabel:{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  headerTimeValue:{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  countdownBadge: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  countdownLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  countdownText:  { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2 },
  gateBadge:      { flexDirection: 'row', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  gateText:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  liveDot:        { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Timeline
  timelineWrap: { paddingHorizontal: 16, marginTop: 4 },
  stageRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, position: 'relative' },
  connector:    { position: 'absolute', left: 19, top: 44, width: 2, height: 20, zIndex: 0 },
  stageLeft:    { width: 40, alignItems: 'center', marginRight: 12, zIndex: 1 },
  stageCircle:  { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stageEmoji:   { fontSize: 16 },
  pulseDot:     { width: 12, height: 12, borderRadius: 6 },
  stageCard:    { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12 },
  stageCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageTextWrap:{ flex: 1 },
  stageLabel:   { fontSize: 15, fontWeight: '700' },
  stageSub:     { fontSize: 12, marginTop: 2 },
  actionBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  actionBtnText:{ color: '#fff', fontSize: 12, fontWeight: '700' },

  // Quick actions
  quickRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  quickBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  quickEmoji: { fontSize: 20, marginBottom: 4 },
  quickLabel: { fontSize: 11, fontWeight: '600' },

  // Insurance
  insuranceCard:    { marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1.5, padding: 14, flexDirection: 'row', alignItems: 'center' },
  insuranceLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center' },
  insuranceEmoji:   { fontSize: 28, marginRight: 12 },
  insuranceText:    { flex: 1 },
  insuranceTitle:   { fontSize: 15, fontWeight: '800', color: '#C2410C', marginBottom: 2 },
  insuranceSub:     { fontSize: 12, color: '#9A3412', lineHeight: 16, marginBottom: 6 },
  insuranceBadge:   { backgroundColor: '#FED7AA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  insuranceBadgeText:{ fontSize: 10, fontWeight: '700', color: '#92400E' },
  insuranceChevron: { fontSize: 22, color: '#FB923C', fontWeight: '300' },

  // Dashboard link
  dashboardLink:     { marginHorizontal: 16, marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, alignItems: 'center' },
  dashboardLinkText: { fontSize: 13, fontWeight: '600' },
});
