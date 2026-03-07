import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

// ─── Skeleton card ────────────────────────────────────────────────────────────

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
      <View style={sk.chips}><View style={sk.chip} /><View style={sk.chip} /></View>
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
  route: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  code: { width: 50, height: 26, borderRadius: 6, backgroundColor: '#D1D5DB', marginBottom: 6 },
  time: { width: 65, height: 14, borderRadius: 5, backgroundColor: '#D1D5DB' },
  plane: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#D1D5DB' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { width: 88, height: 28, borderRadius: 8, backgroundColor: '#D1D5DB' },
});

// ─── Result flight card ───────────────────────────────────────────────────────

function ResultCard({
  flight,
  fadeAnim,
  scaleAnim,
  f1, f2, f3, f4,
}: {
  flight: FlightData;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  f1: Animated.Value; f2: Animated.Value; f3: Animated.Value; f4: Animated.Value;
}) {
  return (
    <Animated.View style={[rc.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[rc.header, { opacity: f1 }]}>
        <View style={[rc.badge, { backgroundColor: statusColor(flight.status) }]}>
          <Text style={rc.badgeText}>{statusLabel(flight.status)}</Text>
        </View>
        <Text style={rc.flightNum}>{flight.flightIata}</Text>
      </Animated.View>
      <Animated.Text style={[rc.airline, { opacity: f1 }]}>
        {flight.airline}{flight.pnr ? `  ·  PNR: ${flight.pnr}` : ''}
      </Animated.Text>
      <View style={rc.div} />
      <Animated.View style={[rc.route, { opacity: f2 }]}>
        <View>
          <Text style={rc.iata}>{flight.dep.iata}</Text>
          <Text style={rc.time}>{formatISOTime(flight.dep.scheduledTime)}</Text>
        </View>
        <Text style={rc.plane}>✈</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[rc.iata, { color: colors.primary }]}>{flight.arr.iata}</Text>
          <Text style={rc.time}>{formatISOTime(flight.arr.scheduledTime)}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[rc.chips, { opacity: f3 }]}>
        {flight.dep.terminal ? (
          <View style={rc.chip}><Text style={rc.chipTxt}>Terminal {flight.dep.terminal}</Text></View>
        ) : null}
        {flight.arr.gate ? (
          <View style={[rc.chip, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[rc.chipTxt, { color: colors.primary }]}>Gate {flight.arr.gate}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Animated.View style={[rc.airports, { opacity: f4 }]}>
        <Text style={rc.airportName} numberOfLines={1}>{flight.dep.airport}</Text>
        <Text style={[rc.airportName, { textAlign: 'right' }]} numberOfLines={1}>{flight.arr.airport}</Text>
      </Animated.View>
    </Animated.View>
  );
}
const rc = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  flightNum: { fontSize: 18, fontWeight: '800', color: colors.text },
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

export function AddFlightScreen() {
  const navigation = useNavigation<any>();
  const { addFlight } = useFlights();

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

  // Shimmer loop
  useEffect(() => {
    if (lookupState === 'loading') {
      shimmerLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1,   duration: 650, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.3, duration: 650, useNativeDriver: true }),
        ]),
      );
      shimmerLoop.current.start();
    } else {
      shimmerLoop.current?.stop();
      shimmerAnim.setValue(0.4);
    }
    return () => { shimmerLoop.current?.stop(); };
  }, [lookupState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal animation
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
    setLookupState('loading');
    setErrorMsg('');
    setPendingFlight(null);
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
    addFlight(pendingFlight);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        {/* ── FORM ───────────────────────────────────────── */}
        {(lookupState === 'idle' || lookupState === 'error') && (
          <View>
            <Text style={styles.label}>PNR / Booking Reference</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABCDEF (optional)"
              placeholderTextColor={colors.textSecondary}
              value={pnr}
              onChangeText={setPnr}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text style={styles.label}>
              Flight Number <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 6E204, AI302, SG101"
              placeholderTextColor={colors.textSecondary}
              value={flightNum}
              onChangeText={setFlightNum}
              autoCapitalize="characters"
              maxLength={8}
            />

            <Text style={styles.label}>
              Travel Date <Text style={styles.req}>*</Text>
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.chip, travelDate === todayISO() && styles.chipActive]}
                onPress={() => setTravelDate(todayISO())}>
                <Text style={[styles.chipTxt, travelDate === todayISO() && styles.chipTxtActive]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, travelDate === tomorrowISO() && styles.chipActive]}
                onPress={() => setTravelDate(tomorrowISO())}>
                <Text style={[styles.chipTxt, travelDate === tomorrowISO() && styles.chipTxtActive]}>Tomorrow</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={travelDate}
              onChangeText={setTravelDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {lookupState === 'error' && (
              <View style={styles.errBox}>
                <Text style={styles.errTxt}>⚠️ {errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup}>
              <Text style={styles.lookupBtnTxt}>🔍  Look Up Flight</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              💡 Best results within 48 hrs of departure. AviationStack powers the lookup.
            </Text>
          </View>
        )}

        {/* ── LOADING ─────────────────────────────────────── */}
        {lookupState === 'loading' && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.loadingTxt}>Fetching flight details...</Text>
            <SkeletonCard opacity={shimmerAnim} />
          </View>
        )}

        {/* ── SUCCESS ─────────────────────────────────────── */}
        {lookupState === 'success' && pendingFlight && (
          <View>
            <Text style={styles.foundTxt}>✅ Flight found!</Text>
            <ResultCard
              flight={pendingFlight}
              fadeAnim={cardFade}
              scaleAnim={cardScale}
              f1={f1} f2={f2} f3={f3} f4={f4}
            />
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 4 },
  req: { color: colors.error },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: colors.text, backgroundColor: colors.card, marginBottom: 16,
  },
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
