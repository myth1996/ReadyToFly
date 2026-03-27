import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightsContext';
import { haptic } from '../services/HapticService';
import {
  FlightData,
  lookupFlight,
  normalizeFlightNumber,
  formatISOTime,
  statusLabel,
  statusColor,
} from '../services/FlightService';

type LookupState = 'idle' | 'loading' | 'success' | 'error';

// IST-safe: toISOString() is UTC and flips to next day after 18:30 IST
function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function tomorrowISO(): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={[sk.card, { opacity }]}>
      <View style={sk.badgeRow}><View style={sk.badge} /><View style={sk.num} /></View>
      <View style={sk.airline} />
      <View style={sk.div} />
      <View style={sk.route}>
        <View><View style={sk.code} /><View style={sk.time} /></View>
        <View style={sk.plane} />
        <View style={{ alignItems: 'flex-end' }}><View style={sk.code} /><View style={sk.time} /></View>
      </View>
    </Animated.View>
  );
}
const sk = StyleSheet.create({
  card: { backgroundColor: '#E5E7EB', borderRadius: 16, padding: 20, marginVertical: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badge: { width: 70, height: 22, borderRadius: 11, backgroundColor: '#D1D5DB', marginRight: 8 },
  num: { width: 80, height: 20, borderRadius: 6, backgroundColor: '#D1D5DB' },
  airline: { width: 120, height: 14, borderRadius: 5, backgroundColor: '#D1D5DB', marginBottom: 14 },
  div: { height: 1, backgroundColor: '#D1D5DB', marginBottom: 14 },
  route: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { width: 50, height: 26, borderRadius: 6, backgroundColor: '#D1D5DB', marginBottom: 6 },
  time: { width: 65, height: 14, borderRadius: 5, backgroundColor: '#D1D5DB' },
  plane: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#D1D5DB' },
});

// ─── Flight card ──────────────────────────────────────────────────────────────
function FlightCard({
  flight, fadeAnim, scaleAnim, f1, f2, f3, f4, onRemove, colors: c,
}: {
  flight: FlightData;
  fadeAnim: Animated.Value; scaleAnim: Animated.Value;
  f1: Animated.Value; f2: Animated.Value; f3: Animated.Value; f4: Animated.Value;
  onRemove?: () => void;
  colors: any;
}) {
  return (
    <Animated.View style={[fcStyles.card, { backgroundColor: c.card, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[fcStyles.header, { opacity: f1 }]}>
        <View style={[fcStyles.badge, { backgroundColor: statusColor(flight.status) }]}>
          <Text style={fcStyles.badgeText}>{statusLabel(flight.status)}</Text>
        </View>
        <Text style={[fcStyles.flightNum, { color: c.text }]}>{flight.flightIata}</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove}><Text style={[fcStyles.remove, { color: c.textSecondary }]}>✕</Text></TouchableOpacity>
        )}
      </Animated.View>
      <Animated.Text style={[fcStyles.airline, { color: c.textSecondary, opacity: f1 }]}>
        {flight.airline}{flight.pnr ? `  ·  PNR: ${flight.pnr}` : ''}
      </Animated.Text>
      <View style={[fcStyles.div, { backgroundColor: c.border }]} />
      <Animated.View style={[fcStyles.route, { opacity: f2 }]}>
        <View>
          <Text style={[fcStyles.iata, { color: c.text }]}>{flight.dep.iata}</Text>
          <Text style={[fcStyles.time, { color: c.textSecondary }]}>{formatISOTime(flight.dep.scheduledTime)}</Text>
        </View>
        <Text style={[fcStyles.plane, { color: c.primary }]}>✈</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[fcStyles.iata, { color: c.primary }]}>{flight.arr.iata}</Text>
          <Text style={[fcStyles.time, { color: c.textSecondary }]}>{formatISOTime(flight.arr.scheduledTime)}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[fcStyles.chips, { opacity: f3 }]}>
        {flight.dep.terminal ? <View style={[fcStyles.chip, { backgroundColor: c.background }]}><Text style={[fcStyles.chipTxt, { color: c.text }]}>Terminal {flight.dep.terminal}</Text></View> : null}
        {flight.arr.gate ? <View style={[fcStyles.chip, { backgroundColor: c.primary + '18' }]}><Text style={[fcStyles.chipTxt, { color: c.primary }]}>Gate {flight.arr.gate}</Text></View> : null}
      </Animated.View>
      <Animated.View style={[fcStyles.airports, { opacity: f4 }]}>
        <Text style={[fcStyles.airportName, { color: c.textSecondary }]} numberOfLines={1}>{flight.dep.airport}</Text>
        <Text style={[fcStyles.airportName, { color: c.textSecondary, textAlign: 'right' }]} numberOfLines={1}>{flight.arr.airport}</Text>
      </Animated.View>
    </Animated.View>
  );
}
const fcStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 20, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  flightNum: { fontSize: 18, fontWeight: '800', flex: 1 },
  remove: { fontSize: 16 },
  airline: { fontSize: 13, marginBottom: 14 },
  div: { height: 1, marginBottom: 14 },
  route: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  iata: { fontSize: 26, fontWeight: '800' },
  time: { fontSize: 13, marginTop: 2 },
  plane: { fontSize: 22 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipTxt: { fontSize: 12, fontWeight: '700' },
  airports: { flexDirection: 'row', justifyContent: 'space-between' },
  airportName: { fontSize: 11, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function MyFlightsScreen() {
  const { themeColors: c } = useSettings();
  const { isPremiumUser } = useAuth();
  const { flights, addFlight, removeFlight, refreshAllFlights, isRefreshing } = useFlights();

  const [modalVisible, setModalVisible] = useState(false);
  const [pnr, setPnr] = useState('');
  const [flightNum, setFlightNum] = useState('');
  const [travelDate, setTravelDate] = useState(todayISO());
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingFlight, setPendingFlight] = useState<FlightData | null>(null);

  const shimmerAnim = useRef(new Animated.Value(0.4)).current;
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);
  const cardFade  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const f3 = useRef(new Animated.Value(0)).current;
  const f4 = useRef(new Animated.Value(0)).current;

  // Saved card animation refs — capped to flights.length to prevent memory leaks
  const savedFades  = useRef<Animated.Value[]>([]);
  const savedScales = useRef<Animated.Value[]>([]);
  const savedF1s    = useRef<Animated.Value[]>([]);
  const savedF2s    = useRef<Animated.Value[]>([]);
  const savedF3s    = useRef<Animated.Value[]>([]);
  const savedF4s    = useRef<Animated.Value[]>([]);

  // Keep animation arrays in sync with flights length
  useEffect(() => {
    const len = flights.length;
    // Trim if flights were removed
    if (savedFades.current.length > len) {
      savedFades.current.length = len;
      savedScales.current.length = len;
      savedF1s.current.length = len;
      savedF2s.current.length = len;
      savedF3s.current.length = len;
      savedF4s.current.length = len;
    }
  }, [flights.length]);

  useEffect(() => {
    if (lookupState === 'loading') {
      shimmerLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1,   duration: 650, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ]));
      shimmerLoop.current.start();
    } else {
      shimmerLoop.current?.stop();
      shimmerAnim.setValue(0.4);
    }
    return () => { shimmerLoop.current?.stop(); };
  }, [lookupState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lookupState === 'success') {
      cardFade.setValue(0); cardScale.setValue(0.92);
      [f1, f2, f3, f4].forEach(a => a.setValue(0));
      Animated.sequence([
        Animated.parallel([
          Animated.spring(cardScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
          Animated.timing(cardFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
        Animated.stagger(110, [
          Animated.timing(f1, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(f2, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(f3, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(f4, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [lookupState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLookup = async () => {
    const iata = normalizeFlightNumber(flightNum);
    if (!iata || iata.length < 3) {
      Alert.alert('Missing info', 'Please enter a valid flight number (e.g. 6E204 or AI302).');
      return;
    }
    setLookupState('loading'); setErrorMsg(''); setPendingFlight(null);
    try {
      const data = await lookupFlight(iata, travelDate, pnr.trim());
      setPendingFlight(data);
      setLookupState('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setLookupState('error');
    }
  };

  const handleSave = () => {
    if (!pendingFlight) { return; }
    haptic.success();
    savedFades.current.push(new Animated.Value(0));
    savedScales.current.push(new Animated.Value(0.92));
    savedF1s.current.push(new Animated.Value(0));
    savedF2s.current.push(new Animated.Value(0));
    savedF3s.current.push(new Animated.Value(0));
    savedF4s.current.push(new Animated.Value(0));
    addFlight(pendingFlight);
    closeModal();

    const idx = flights.length;
    setTimeout(() => {
      const fa = savedFades.current[idx];
      const sc = savedScales.current[idx];
      const a1 = savedF1s.current[idx];
      const a2 = savedF2s.current[idx];
      const a3 = savedF3s.current[idx];
      const a4 = savedF4s.current[idx];
      if (!fa) { return; }
      Animated.sequence([
        Animated.parallel([
          Animated.spring(sc, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
          Animated.timing(fa, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.stagger(100, [
          Animated.timing(a1, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(a2, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(a3, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(a4, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    }, 100);
  };

  const openModal = () => {
    setPnr(''); setFlightNum(''); setTravelDate(todayISO());
    setLookupState('idle'); setPendingFlight(null); setErrorMsg('');
    setModalVisible(true);
  };
  const closeModal = () => { setModalVisible(false); setLookupState('idle'); setPendingFlight(null); };

  const handleRefresh = useCallback(() => {
    refreshAllFlights();
  }, [refreshAllFlights]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, flights.length === 0 && styles.center]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }>
        <Text style={[styles.heading, { color: c.text }]}>My Flights</Text>
        <Text style={[styles.subheading, { color: c.textSecondary }]}>Track real-time status, gate & delay info</Text>

        {flights.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: c.card }]}>
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No flights added yet</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              Enter your PNR & flight number — we'll fetch live status, gate info, and delay alerts instantly.
            </Text>
          </View>
        ) : (
          flights.map((flight, idx) => {
            const fade  = savedFades.current[idx]  ?? new Animated.Value(1);
            const scale = savedScales.current[idx] ?? new Animated.Value(1);
            const a1    = savedF1s.current[idx]    ?? new Animated.Value(1);
            const a2    = savedF2s.current[idx]    ?? new Animated.Value(1);
            const a3    = savedF3s.current[idx]    ?? new Animated.Value(1);
            const a4    = savedF4s.current[idx]    ?? new Animated.Value(1);
            return (
              <FlightCard key={idx} flight={flight}
                fadeAnim={fade} scaleAnim={scale}
                f1={a1} f2={a2} f3={a3} f4={a4}
                onRemove={() => removeFlight(idx)}
                colors={c}
              />
            );
          })
        )}
      </ScrollView>


      {/* ── Banner Ad (free users) ───────────────────────── */}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
      <TouchableOpacity style={[styles.fab, { backgroundColor: c.primary }]} onPress={openModal}>
        <Text style={styles.fabText}>+ Add Flight</Text>
      </TouchableOpacity>

      {/* ── Add Flight Modal ─────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={[styles.modalRoot, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Add Flight</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.modalClose, { color: c.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {(lookupState === 'idle' || lookupState === 'error') && (
              <View>
                <Text style={[styles.label, { color: c.text }]}>PNR / Booking Reference</Text>
                <TextInput style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]} placeholder="e.g. ABCDEF (optional)" placeholderTextColor={c.textSecondary} value={pnr} onChangeText={setPnr} autoCapitalize="characters" maxLength={10} />
                <Text style={[styles.label, { color: c.text }]}>Flight Number <Text style={styles.req}>*</Text></Text>
                <TextInput style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]} placeholder="e.g. 6E204, AI302, SG101" placeholderTextColor={c.textSecondary} value={flightNum} onChangeText={setFlightNum} autoCapitalize="characters" maxLength={8} />
                <Text style={[styles.label, { color: c.text }]}>Travel Date <Text style={styles.req}>*</Text></Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={[styles.chip, { borderColor: c.border, backgroundColor: c.card }, travelDate === todayISO() && { borderColor: c.primary, backgroundColor: c.primary + '18' }]} onPress={() => setTravelDate(todayISO())}>
                    <Text style={[styles.chipTxt, { color: c.textSecondary }, travelDate === todayISO() && { color: c.primary }]}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, { borderColor: c.border, backgroundColor: c.card }, travelDate === tomorrowISO() && { borderColor: c.primary, backgroundColor: c.primary + '18' }]} onPress={() => setTravelDate(tomorrowISO())}>
                    <Text style={[styles.chipTxt, { color: c.textSecondary }, travelDate === tomorrowISO() && { color: c.primary }]}>Tomorrow</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginTop: 8, borderColor: c.border, color: c.text, backgroundColor: c.card }]} placeholder="YYYY-MM-DD" placeholderTextColor={c.textSecondary} value={travelDate} onChangeText={setTravelDate} keyboardType="numbers-and-punctuation" maxLength={10} />
                {lookupState === 'error' && <View style={styles.errBox}><Text style={styles.errTxt}>⚠️ {errorMsg}</Text></View>}
                <TouchableOpacity style={[styles.lookupBtn, { backgroundColor: c.primary }]} onPress={handleLookup}>
                  <Text style={styles.lookupBtnTxt}>🔍  Look Up Flight</Text>
                </TouchableOpacity>
                <Text style={[styles.hint, { color: c.textSecondary }]}>💡 Best results within 48 hrs of departure.</Text>
              </View>
            )}

            {lookupState === 'loading' && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={c.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.loadingTxt, { color: c.textSecondary }]}>Fetching flight details...</Text>
                <SkeletonCard opacity={shimmerAnim} />
              </View>
            )}

            {lookupState === 'success' && pendingFlight && (
              <View>
                <Text style={styles.foundTxt}>✅ Flight found!</Text>
                <FlightCard flight={pendingFlight} fadeAnim={cardFade} scaleAnim={cardScale} f1={f1} f2={f2} f3={f3} f4={f4} colors={c} />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.primary }]} onPress={handleSave}>
                  <Text style={styles.saveBtnTxt}>Save to My Trips →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setLookupState('idle'); setPendingFlight(null); }}>
                  <Text style={[styles.retryTxt, { color: c.textSecondary }]}>Search a different flight</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  center: { flexGrow: 1 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 24 },
  emptyBox: { alignItems: 'center', borderRadius: 16, padding: 40, elevation: 1, marginTop: 20 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, left: 20, right: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalRoot: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalClose: { fontSize: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  req: { color: '#EF4444' },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 16 },
  dateRow: { flexDirection: 'row', gap: 10 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  errBox: { backgroundColor: '#EF444418', borderRadius: 10, padding: 14, marginBottom: 16 },
  errTxt: { color: '#EF4444', fontSize: 13, lineHeight: 20 },
  lookupBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16, elevation: 2 },
  lookupBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  loadingWrap: { alignItems: 'center' },
  loadingTxt: { fontSize: 14, marginBottom: 4 },
  foundTxt: { fontSize: 15, fontWeight: '700', color: '#10B981', marginBottom: 12 },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 12, elevation: 2 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  retryBtn: { alignItems: 'center', paddingVertical: 10 },
  retryTxt: { fontSize: 14 },
});
