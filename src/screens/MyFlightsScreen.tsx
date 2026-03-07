import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { colors } from '../theme';
import { useFlights } from '../context/FlightsContext';
import {
  FlightData,
  lookupFlight,
  normalizeFlightNumber,
  formatISOTime,
  statusLabel,
  statusColor,
} from '../services/FlightService';

type LookupState = 'idle' | 'loading' | 'success' | 'error';

function todayISO()    { return new Date().toISOString().slice(0, 10); }
function tomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }

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
  flight, fadeAnim, scaleAnim, f1, f2, f3, f4, onRemove,
}: {
  flight: FlightData;
  fadeAnim: Animated.Value; scaleAnim: Animated.Value;
  f1: Animated.Value; f2: Animated.Value; f3: Animated.Value; f4: Animated.Value;
  onRemove?: () => void;
}) {
  return (
    <Animated.View style={[fc.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[fc.header, { opacity: f1 }]}>
        <View style={[fc.badge, { backgroundColor: statusColor(flight.status) }]}>
          <Text style={fc.badgeText}>{statusLabel(flight.status)}</Text>
        </View>
        <Text style={fc.flightNum}>{flight.flightIata}</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove}><Text style={fc.remove}>✕</Text></TouchableOpacity>
        )}
      </Animated.View>
      <Animated.Text style={[fc.airline, { opacity: f1 }]}>
        {flight.airline}{flight.pnr ? `  ·  PNR: ${flight.pnr}` : ''}
      </Animated.Text>
      <View style={fc.div} />
      <Animated.View style={[fc.route, { opacity: f2 }]}>
        <View>
          <Text style={fc.iata}>{flight.dep.iata}</Text>
          <Text style={fc.time}>{formatISOTime(flight.dep.scheduledTime)}</Text>
        </View>
        <Text style={fc.plane}>✈</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[fc.iata, { color: colors.primary }]}>{flight.arr.iata}</Text>
          <Text style={fc.time}>{formatISOTime(flight.arr.scheduledTime)}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[fc.chips, { opacity: f3 }]}>
        {flight.dep.terminal ? <View style={fc.chip}><Text style={fc.chipTxt}>Terminal {flight.dep.terminal}</Text></View> : null}
        {flight.arr.gate ? <View style={[fc.chip, { backgroundColor: colors.primary + '18' }]}><Text style={[fc.chipTxt, { color: colors.primary }]}>Gate {flight.arr.gate}</Text></View> : null}
      </Animated.View>
      <Animated.View style={[fc.airports, { opacity: f4 }]}>
        <Text style={fc.airportName} numberOfLines={1}>{flight.dep.airport}</Text>
        <Text style={[fc.airportName, { textAlign: 'right' }]} numberOfLines={1}>{flight.arr.airport}</Text>
      </Animated.View>
    </Animated.View>
  );
}
const fc = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  flightNum: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  remove: { fontSize: 16, color: colors.textSecondary },
  airline: { fontSize: 13, color: colors.textSecondary, marginBottom: 14 },
  div: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  route: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  iata: { fontSize: 26, fontWeight: '800', color: colors.text },
  time: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  plane: { fontSize: 22, color: colors.primary },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipTxt: { fontSize: 12, fontWeight: '700', color: colors.text },
  airports: { flexDirection: 'row', justifyContent: 'space-between' },
  airportName: { fontSize: 11, color: colors.textSecondary, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function MyFlightsScreen() {
  // Use shared FlightsContext
  const { flights, addFlight, removeFlight } = useFlights();

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

  // Saved card animation refs
  const savedFades  = useRef<Animated.Value[]>([]);
  const savedScales = useRef<Animated.Value[]>([]);
  const savedF1s    = useRef<Animated.Value[]>([]);
  const savedF2s    = useRef<Animated.Value[]>([]);
  const savedF3s    = useRef<Animated.Value[]>([]);
  const savedF4s    = useRef<Animated.Value[]>([]);

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
    // Prepare animation values for new card
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
      const f  = savedFades.current[idx];
      const s  = savedScales.current[idx];
      const a1 = savedF1s.current[idx];
      const a2 = savedF2s.current[idx];
      const a3 = savedF3s.current[idx];
      const a4 = savedF4s.current[idx];
      if (!f) { return; }
      Animated.sequence([
        Animated.parallel([
          Animated.spring(s, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
          Animated.timing(f, { toValue: 1, duration: 300, useNativeDriver: true }),
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

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, flights.length === 0 && styles.center]}>
        <Text style={styles.heading}>My Flights</Text>
        <Text style={styles.subheading}>Track real-time status, gate & delay info</Text>

        {flights.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={styles.emptyTitle}>No flights added yet</Text>
            <Text style={styles.emptyDesc}>
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
              />
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text style={styles.fabText}>+ Add Flight</Text>
      </TouchableOpacity>

      {/* ── Add Flight Modal ─────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Flight</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {(lookupState === 'idle' || lookupState === 'error') && (
              <View>
                <Text style={styles.label}>PNR / Booking Reference</Text>
                <TextInput style={styles.input} placeholder="e.g. ABCDEF (optional)" placeholderTextColor={colors.textSecondary} value={pnr} onChangeText={setPnr} autoCapitalize="characters" maxLength={10} />
                <Text style={styles.label}>Flight Number <Text style={styles.req}>*</Text></Text>
                <TextInput style={styles.input} placeholder="e.g. 6E204, AI302, SG101" placeholderTextColor={colors.textSecondary} value={flightNum} onChangeText={setFlightNum} autoCapitalize="characters" maxLength={8} />
                <Text style={styles.label}>Travel Date <Text style={styles.req}>*</Text></Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={[styles.chip, travelDate === todayISO() && styles.chipActive]} onPress={() => setTravelDate(todayISO())}>
                    <Text style={[styles.chipTxt, travelDate === todayISO() && styles.chipTxtActive]}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, travelDate === tomorrowISO() && styles.chipActive]} onPress={() => setTravelDate(tomorrowISO())}>
                    <Text style={[styles.chipTxt, travelDate === tomorrowISO() && styles.chipTxtActive]}>Tomorrow</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} value={travelDate} onChangeText={setTravelDate} keyboardType="numbers-and-punctuation" maxLength={10} />
                {lookupState === 'error' && <View style={styles.errBox}><Text style={styles.errTxt}>⚠️ {errorMsg}</Text></View>}
                <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup}>
                  <Text style={styles.lookupBtnTxt}>🔍  Look Up Flight</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>💡 Best results within 48 hrs of departure.</Text>
              </View>
            )}

            {lookupState === 'loading' && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.loadingTxt}>Fetching flight details...</Text>
                <SkeletonCard opacity={shimmerAnim} />
              </View>
            )}

            {lookupState === 'success' && pendingFlight && (
              <View>
                <Text style={styles.foundTxt}>✅ Flight found!</Text>
                <FlightCard flight={pendingFlight} fadeAnim={cardFade} scaleAnim={cardScale} f1={f1} f2={f2} f3={f3} f4={f4} />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnTxt}>Save to My Trips →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setLookupState('idle'); setPendingFlight(null); }}>
                  <Text style={styles.retryTxt}>Search a different flight</Text>
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
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  center: { flexGrow: 1 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  emptyBox: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 40, elevation: 1, marginTop: 20 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 4 },
  req: { color: colors.error },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card, marginBottom: 16 },
  dateRow: { flexDirection: 'row', gap: 10 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: colors.card },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  chipTxt: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTxtActive: { color: colors.primary },
  errBox: { backgroundColor: colors.error + '18', borderRadius: 10, padding: 14, marginBottom: 16 },
  errTxt: { color: colors.error, fontSize: 13, lineHeight: 20 },
  lookupBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16, elevation: 2 },
  lookupBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  loadingWrap: { alignItems: 'center' },
  loadingTxt: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  foundTxt: { fontSize: 15, fontWeight: '700', color: colors.success, marginBottom: 12 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 12, elevation: 2 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  retryBtn: { alignItems: 'center', paddingVertical: 10 },
  retryTxt: { color: colors.textSecondary, fontSize: 14 },
});
