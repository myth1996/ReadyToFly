import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import { AdGuard } from '../services/AdGuard';
import { useFlights } from '../context/FlightsContext';
import { formatISOTime } from '../services/FlightService';
import { notificationService } from '../services/NotificationService';
import { airportMapsQuery } from '../data/airports';
import { AirportSearchInput } from '../components/AirportSearchInput';

// Buffer times in minutes
const DOMESTIC_CHECKIN = 60;
const INTERNATIONAL_CHECKIN = 90;
const SECURITY_TIME = 30;
const GATE_TIME = 20;
const LOW_BUFFER_WARN = 30;

// Airport names are now sourced from src/data/airports.ts (covers all Indian
// airports + 55+ international destinations for Indian travellers).

type Result = {
  leaveByTime: Date;
  travelMins: number;
  checkinMins: number;
  securityMins: number;
  gateMins: number;
  totalMins: number;
  departureTime: Date;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${pad(h % 12 || 12)}:${pad(m)} ${ampm}`;
}

function getCountdown(leaveBy: Date) {
  const diff = leaveBy.getTime() - Date.now();
  if (diff <= 0) { return { text: 'You should have left already!', urgent: true }; }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0) { return { text: `Leave in ${m} min`, urgent: m < LOW_BUFFER_WARN }; }
  return { text: `Leave in ${h}h ${m}m`, urgent: false };
}

export function LeaveByScreen() {
  const { themeColors: c } = useSettings();
  const { isPremiumUser } = useAuth();
  const { nextFlight } = useFlights();

  const [flightNum, setFlightNum] = useState('');
  const [departureHour, setDepartureHour] = useState('');
  const [departureMin, setDepartureMin] = useState('');
  const [isAM, setIsAM] = useState(true);
  const [isInternational, setIsInternational] = useState(false);
  const [hasBaggage, setHasBaggage] = useState(true);
  const [travelMins, setTravelMins] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [countdown, setCountdown] = useState('');
  const [countdownUrgent, setCountdownUrgent] = useState(false);
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [depAirportIata, setDepAirportIata] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (result) {
      const tick = () => {
        const { text, urgent } = getCountdown(result.leaveByTime);
        setCountdown(text);
        setCountdownUrgent(urgent);
      };
      tick();
      timerRef.current = setInterval(tick, 30000);
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); } };
  }, [result]);

  // Pre-fill from next flight
  const handlePrefill = () => {
    if (!nextFlight) { return; }
    const depDate = new Date(nextFlight.dep.scheduledTime);
    const h24 = depDate.getHours();
    const m = depDate.getMinutes();
    const am = h24 < 12;

    setFlightNum(nextFlight.flightIata);
    setDepartureHour(String(h24 % 12 || 12));
    setDepartureMin(pad(m));
    setIsAM(am);
    setDepAirportIata(nextFlight.dep.iata);
    setPrefilledFrom(nextFlight.flightIata);
  };

  const openGoogleMaps = () => {
    const airportName = airportMapsQuery(depAirportIata);
    const url = `google.navigation:q=${encodeURIComponent(airportName)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(airportName)}`);
      }
    });
  };

  const calculate = () => {
    const h = parseInt(departureHour, 10);
    const m = parseInt(departureMin, 10);
    const travel = parseInt(travelMins, 10);

    if (!departureHour || !departureMin || isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
      Alert.alert('Missing info', 'Please enter a valid departure time (e.g. 10:30 AM).');
      return;
    }
    if (!travelMins || isNaN(travel) || travel <= 0) {
      Alert.alert('Missing info', 'Please enter your travel time to the airport in minutes.');
      return;
    }

    const now = new Date();
    const dep = new Date(now);
    let hour24 = h % 12;
    if (!isAM) { hour24 += 12; }
    dep.setHours(hour24, m, 0, 0);
    if (dep.getTime() < now.getTime()) {
      dep.setDate(dep.getDate() + 1);
    }

    const checkinMins = isInternational ? INTERNATIONAL_CHECKIN : DOMESTIC_CHECKIN;
    const effectiveCheckin = hasBaggage ? checkinMins : Math.max(checkinMins - 20, 30);
    const totalMins = travel + effectiveCheckin + SECURITY_TIME + GATE_TIME;
    const leaveByTime = new Date(dep.getTime() - totalMins * 60 * 1000);

    setResult({
      leaveByTime,
      travelMins: travel,
      checkinMins: effectiveCheckin,
      securityMins: SECURITY_TIME,
      gateMins: GATE_TIME,
      totalMins,
      departureTime: dep,
    });

    // Schedule notification
    scheduleReminder(leaveByTime, flightNum, depAirportIata);
  };

  const scheduleReminder = async (leaveByTime: Date, flight: string, depIata: string) => {
    try {
      const hasPermission = await notificationService.requestPermission();
      if (!hasPermission) { return; }
      await notificationService.scheduleLeaveByReminder({
        flightIata: flight || 'flight',
        leaveByTime,
        depIata: depIata || 'airport',
      });
    } catch (_) { /* fail silently */ }
  };

  const reset = () => {
    setResult(null);
    setFlightNum('');
    setDepartureHour('');
    setDepartureMin('');
    setTravelMins('');
    setPrefilledFrom(null);
    setDepAirportIata('');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.heading, { color: c.text }]}>Leave-By Calculator</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>Know exactly when to leave home</Text>

      {/* Pre-fill from next flight */}
      {nextFlight && !prefilledFrom && (
        <TouchableOpacity
          style={[styles.prefillCard, { backgroundColor: c.primary + '14', borderColor: c.primary }]}
          onPress={handlePrefill}
          activeOpacity={0.7}>
          <Text style={[styles.prefillText, { color: c.primary }]}>
            ✈️ Use my next flight: {nextFlight.flightIata} ({nextFlight.dep.iata} → {nextFlight.arr.iata})
          </Text>
          <Text style={[styles.prefillTime, { color: c.primary }]}>
            Departs {formatISOTime(nextFlight.dep.scheduledTime)}
          </Text>
        </TouchableOpacity>
      )}

      {prefilledFrom && (
        <View style={[styles.prefillBadge, { backgroundColor: '#10B98118' }]}>
          <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>
            ✅ Pre-filled from {prefilledFrom}
          </Text>
        </View>
      )}

      {/* Flight number */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.text }]}>Flight Number (optional)</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text }]}
          placeholder="e.g. 6E 204, AI 101"
          placeholderTextColor={c.textSecondary}
          value={flightNum}
          onChangeText={setFlightNum}
          autoCapitalize="characters"
        />
      </View>

      {/* Departure time */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.text }]}>Departure Time</Text>
        <View style={styles.timeRow}>
          <TextInput
            style={[styles.input, styles.timeInput, { borderColor: c.border, color: c.text }]}
            placeholder="HH"
            placeholderTextColor={c.textSecondary}
            value={departureHour}
            onChangeText={setDepartureHour}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={[styles.timeSep, { color: c.text }]}>:</Text>
          <TextInput
            style={[styles.input, styles.timeInput, { borderColor: c.border, color: c.text }]}
            placeholder="MM"
            placeholderTextColor={c.textSecondary}
            value={departureMin}
            onChangeText={setDepartureMin}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TouchableOpacity
            style={[styles.ampmBtn, { borderColor: c.border }, isAM && { backgroundColor: c.primary, borderColor: c.primary }]}
            onPress={() => setIsAM(true)}>
            <Text style={[styles.ampmText, { color: c.textSecondary }, isAM && { color: '#fff' }]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ampmBtn, { borderColor: c.border }, !isAM && { backgroundColor: c.primary, borderColor: c.primary }]}
            onPress={() => setIsAM(false)}>
            <Text style={[styles.ampmText, { color: c.textSecondary }, !isAM && { color: '#fff' }]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Departure airport */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <AirportSearchInput
          label="Departure Airport"
          value={depAirportIata}
          onSelect={setDepAirportIata}
          placeholder="IATA or city — e.g. DEL or Delhi"
        />
        <TouchableOpacity onPress={openGoogleMaps} activeOpacity={0.7}>
          <Text style={[styles.hint, { color: c.primary }]}>
            📍 Open Google Maps for directions{depAirportIata ? ` to ${depAirportIata}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Travel time */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.text }]}>Travel Time to Airport (minutes)</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text }]}
          placeholder="e.g. 45"
          placeholderTextColor={c.textSecondary}
          value={travelMins}
          onChangeText={setTravelMins}
          keyboardType="number-pad"
        />
      </View>

      {/* Toggles */}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: c.text }]}>International Flight</Text>
            <Text style={[styles.toggleDesc, { color: c.textSecondary }]}>90 min check-in vs 60 min domestic</Text>
          </View>
          <Switch
            value={isInternational}
            onValueChange={setIsInternational}
            trackColor={{ true: c.primary }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: c.text }]}>Checking in Baggage</Text>
            <Text style={[styles.toggleDesc, { color: c.textSecondary }]}>No baggage = 20 min saved at counter</Text>
          </View>
          <Switch
            value={hasBaggage}
            onValueChange={setHasBaggage}
            trackColor={{ true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.calcBtn, { backgroundColor: c.primary }]} onPress={calculate}>
        <Text style={styles.calcBtnText}>Calculate →</Text>
      </TouchableOpacity>

      {/* Result */}
      {result && (
        <View style={[styles.resultCard, countdownUrgent && styles.resultCardUrgent, !countdownUrgent && { backgroundColor: c.primary }]}>
          <Text style={styles.resultLeaveLabel}>Leave home by</Text>
          <Text style={styles.resultLeaveTime}>{formatTime(result.leaveByTime)}</Text>
          <Text style={[styles.countdownText, countdownUrgent && styles.countdownUrgent]}>
            {countdown}
          </Text>

          <View style={styles.reminderBadge}>
            <Text style={styles.reminderText}>🔔 Reminder set for 15 min before</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.breakdownTitle}>Time breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🚗 Travel to airport</Text>
            <Text style={styles.breakdownValue}>{result.travelMins} min</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🎫 Check-in counter</Text>
            <Text style={styles.breakdownValue}>{result.checkinMins} min</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🔍 Security screening</Text>
            <Text style={styles.breakdownValue}>{result.securityMins} min</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🚪 Walk to gate</Text>
            <Text style={styles.breakdownValue}>{result.gateMins} min</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.totalLabel}>Total buffer needed</Text>
            <Text style={styles.totalValue}>{result.totalMins} min</Text>
          </View>

          <Text style={styles.depTime}>
            ✈️ Departs at {formatTime(result.departureTime)}
          </Text>

          {/* Google Maps button in result */}
          <TouchableOpacity style={styles.mapsBtn} onPress={openGoogleMaps}>
            <Text style={styles.mapsBtnText}>📍 Navigate to Airport</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>Calculate Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Banner Ad (free users) ───────────────────────── */}
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
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 20 },

  // Prefill
  prefillCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  prefillText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  prefillTime: { fontSize: 12 },
  prefillBadge: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },

  // Card
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  hint: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, textAlign: 'center' },
  timeSep: { fontSize: 22, fontWeight: '700' },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  ampmText: { fontSize: 14, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  calcBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  calcBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Result
  resultCard: {
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  resultCardUrgent: { backgroundColor: '#EF4444' },
  resultLeaveLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  resultLeaveTime: { fontSize: 52, fontWeight: '800', color: '#fff', lineHeight: 58 },
  countdownText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, marginBottom: 12 },
  countdownUrgent: { fontWeight: '700' },
  reminderBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  reminderText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  breakdownTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: '#fff' },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  depTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 16, marginBottom: 12 },
  mapsBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14 },
});
