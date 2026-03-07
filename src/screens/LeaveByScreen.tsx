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
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme';

// Buffer times in minutes
const DOMESTIC_CHECKIN = 60;
const INTERNATIONAL_CHECKIN = 90;
const SECURITY_TIME = 30;
const GATE_TIME = 20;
const LOW_BUFFER_WARN = 30;

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
  const [flightNum, setFlightNum] = useState('');
  const [departureHour, setDepartureHour] = useState('');
  const [departureMin, setDepartureMin] = useState('');
  const [isAM, setIsAM] = useState(true);
  const [isInternational, setIsInternational] = useState(false);
  const [hasBaggage, setHasBaggage] = useState(true);
  const [travelMins, setTravelMins] = useState('');
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [countdown, setCountdown] = useState('');
  const [countdownUrgent, setCountdownUrgent] = useState(false);
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
    // If departure appears to be in the past, assume tomorrow
    if (dep.getTime() < now.getTime()) {
      dep.setDate(dep.getDate() + 1);
    }

    const checkinMins = isInternational ? INTERNATIONAL_CHECKIN : DOMESTIC_CHECKIN;
    // If no baggage, reduce check-in by 20 min (online check-in)
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
  };

  const reset = () => {
    setResult(null);
    setFlightNum('');
    setDepartureHour('');
    setDepartureMin('');
    setTravelMins('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Leave-By Calculator</Text>
      <Text style={styles.subheading}>Know exactly when to leave home</Text>

      {/* Flight number */}
      <View style={styles.card}>
        <Text style={styles.label}>Flight Number (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 6E 204, AI 101"
          placeholderTextColor={colors.textSecondary}
          value={flightNum}
          onChangeText={setFlightNum}
          autoCapitalize="characters"
        />
      </View>

      {/* Departure time */}
      <View style={styles.card}>
        <Text style={styles.label}>Departure Time</Text>
        <View style={styles.timeRow}>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="HH"
            placeholderTextColor={colors.textSecondary}
            value={departureHour}
            onChangeText={setDepartureHour}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.timeSep}>:</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="MM"
            placeholderTextColor={colors.textSecondary}
            value={departureMin}
            onChangeText={setDepartureMin}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TouchableOpacity
            style={[styles.ampmBtn, isAM && styles.ampmActive]}
            onPress={() => setIsAM(true)}
          >
            <Text style={[styles.ampmText, isAM && styles.ampmTextActive]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ampmBtn, !isAM && styles.ampmActive]}
            onPress={() => setIsAM(false)}
          >
            <Text style={[styles.ampmText, !isAM && styles.ampmTextActive]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Travel time */}
      <View style={styles.card}>
        <Text style={styles.label}>Travel Time to Airport (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 45"
          placeholderTextColor={colors.textSecondary}
          value={travelMins}
          onChangeText={setTravelMins}
          keyboardType="number-pad"
        />
        <Text style={styles.hint}>
          💡 Check Google Maps for current traffic estimate
        </Text>
      </View>

      {/* Toggles */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>International Flight</Text>
            <Text style={styles.toggleDesc}>90 min check-in vs 60 min domestic</Text>
          </View>
          <Switch
            value={isInternational}
            onValueChange={setIsInternational}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Checking in Baggage</Text>
            <Text style={styles.toggleDesc}>No baggage = 20 min saved at counter</Text>
          </View>
          <Switch
            value={hasBaggage}
            onValueChange={setHasBaggage}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
        <Text style={styles.calcBtnText}>Calculate →</Text>
      </TouchableOpacity>

      {/* Result */}
      {result && (
        <View style={[styles.resultCard, countdownUrgent && styles.resultCardUrgent]}>
          <Text style={styles.resultLeaveLabel}>Leave home by</Text>
          <Text style={styles.resultLeaveTime}>{formatTime(result.leaveByTime)}</Text>
          <Text style={[styles.countdown, countdownUrgent && styles.countdownUrgent]}>
            {countdown}
          </Text>

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

          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>Calculate Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, textAlign: 'center' },
  timeSep: { fontSize: 22, fontWeight: '700', color: colors.text },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ampmActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ampmText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  ampmTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  toggleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  calcBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  calcBtnText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  resultCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  resultCardUrgent: { backgroundColor: colors.error },
  resultLeaveLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  resultLeaveTime: { fontSize: 52, fontWeight: '800', color: colors.white, lineHeight: 58 },
  countdown: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, marginBottom: 20 },
  countdownUrgent: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  breakdownTitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: colors.white },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: colors.white },
  totalValue: { fontSize: 14, fontWeight: '800', color: colors.white },
  depTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
