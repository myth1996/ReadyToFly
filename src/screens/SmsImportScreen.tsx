/**
 * SmsImportScreen — Auto-detect flight bookings from SMS inbox or Gmail
 *
 * SMS tab:
 *  1. Requests READ_SMS permission (Android only)
 *  2. Scans last 500 SMS for Indian airline booking patterns
 *
 * Gmail tab:
 *  1. Requires Google Sign-In with gmail.readonly scope
 *  2. Calls Gmail REST API to search for booking confirmation emails
 *
 * All parsing is on-device. No SMS/email content is sent to any server.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';
import { useAuth } from '../context/AuthContext';
import { smsImportService, ParsedBooking } from '../services/SmsImportService';
import { gmailImportService } from '../services/GmailImportService';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onAdd,
  added,
}: {
  booking: ParsedBooking;
  onAdd: () => void;
  added: boolean;
}) {
  const { themeColors: c } = useSettings();
  const isHigh = booking.confidence === 'high';

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: added ? '#10B981' : c.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.airlineBadge, { backgroundColor: c.primary }]}>
          <Text style={styles.airlineBadgeText}>{booking.airlineCode}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.flightNum, { color: c.text }]}>{booking.flightNumber}</Text>
          <Text style={[styles.pnrText, { color: c.textSecondary }]}>PNR: {booking.pnr}</Text>
          {booking.date ? (
            <Text style={[styles.dateText, { color: c.textSecondary }]}>{booking.date}</Text>
          ) : null}
        </View>
        <View style={[styles.confBadge, { backgroundColor: isHigh ? '#D1FAE5' : '#FEF3C7' }]}>
          <Text style={[styles.confText, { color: isHigh ? '#065F46' : '#92400E' }]}>
            {isHigh ? '✓ High' : '~ Mid'}
          </Text>
        </View>
      </View>

      {!added ? (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={onAdd}>
          <Text style={styles.addBtnText}>+ Add to ReadyToFly</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.addedBadge}>
          <Text style={styles.addedText}>✅ Added — search flight in "Add Flight" screen</Text>
        </View>
      )}
    </View>
  );
}

// ─── Results section ──────────────────────────────────────────────────────────

function ResultsSection({
  scanned,
  bookings,
  added,
  onAdd,
}: {
  scanned: boolean;
  bookings: ParsedBooking[];
  added: Set<string>;
  onAdd: (b: ParsedBooking) => void;
}) {
  const { themeColors: c } = useSettings();
  if (!scanned) { return null; }
  if (bookings.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={styles.emptyEmoji}>🤷</Text>
        <Text style={[styles.emptyTitle, { color: c.text }]}>No bookings found</Text>
        <Text style={[styles.emptySub, { color: c.textSecondary }]}>
          Make sure you have received a booking confirmation from your airline.
          You can also add flights manually via the Add Flight screen.
        </Text>
      </View>
    );
  }
  return (
    <>
      <Text style={[styles.resultsLabel, { color: c.textSecondary }]}>
        Found {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </Text>
      {bookings.map(b => (
        <BookingCard
          key={b.pnr}
          booking={b}
          onAdd={() => onAdd(b)}
          added={added.has(b.pnr)}
        />
      ))}
    </>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type Tab = 'sms' | 'gmail';

export function SmsImportScreen() {
  const { themeColors: c } = useSettings();
  const { googleAccessToken, signInWithGoogle, isPremiumUser } = useAuth();
  const { nextFlight } = useFlights();
  const navigation = useNavigation<any>();

  const [tab, setTab]               = useState<Tab>('sms');
  const [scanning, setScanning]     = useState(false);
  const [smsBookings, setSmsBookings]       = useState<ParsedBooking[]>([]);
  const [gmailBookings, setGmailBookings]   = useState<ParsedBooking[]>([]);
  const [added, setAdded]           = useState<Set<string>>(new Set());
  const [smsScanned, setSmsScanned] = useState(false);
  const [gmailScanned, setGmailScanned]     = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  // ── SMS scan ────────────────────────────────────────────────────────────────
  const handleSmsScan = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'SMS import is only supported on Android devices.');
      return;
    }
    haptic.impact();
    setScanning(true);
    setSmsScanned(false);
    try {
      const found = await smsImportService.importBookingsFromSms();
      setSmsBookings(found);
      setSmsScanned(true);
      if (found.length > 0) {
        adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, nextFlight));
      }
    } finally {
      setScanning(false);
    }
  };

  // ── Gmail scan ──────────────────────────────────────────────────────────────
  const handleGmailScan = async () => {
    haptic.impact();
    setGmailError(null);

    // If not signed in with Google, prompt sign-in
    if (!googleAccessToken) {
      Alert.alert(
        'Sign in with Google',
        'ReadyToFly needs your Google account to search for airline booking emails in your Gmail inbox.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign in with Google',
            onPress: async () => {
              try {
                await signInWithGoogle();
              } catch (_) {
                Alert.alert('Sign-in Failed', 'Could not sign in with Google. Please try again.');
              }
            },
          },
        ],
      );
      return;
    }

    setScanning(true);
    setGmailScanned(false);
    try {
      const found = await gmailImportService.importBookingsFromGmail(googleAccessToken);
      setGmailBookings(found);
      setGmailScanned(true);
      if (found.length > 0) {
        adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, nextFlight));
      }
    } catch (err: any) {
      setGmailError(err?.message ?? 'Could not read Gmail. Your token may have expired — try signing out and back in.');
      setGmailScanned(true);
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = (booking: ParsedBooking) => {
    haptic.impact();
    navigation.navigate('AddFlight');
    setAdded(prev => new Set(prev).add(booking.pnr));
    Alert.alert(
      'Flight Detected',
      `Search for "${booking.flightNumber}" in the Add Flight screen to confirm and add it with live data from AviationStack.`,
      [{ text: 'OK' }],
    );
  };

  const isSmsTab    = tab === 'sms';
  const isGmailTab  = tab === 'gmail';
  const bookings    = isSmsTab ? smsBookings : gmailBookings;
  const scanned     = isSmsTab ? smsScanned  : gmailScanned;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: c.primary }]}>
        <Text style={styles.headerEmoji}>📩</Text>
        <Text style={styles.headerTitle}>Auto-Import Flights</Text>
        <Text style={styles.headerSub}>
          Scan your SMS or Gmail inbox for IndiGo, Air India, SpiceJet,
          Vistara, Akasa & AirAsia booking confirmations.
          {'\n\n'}
          Everything runs on your phone — messages are never sent to any server.
        </Text>
      </View>

      {/* Tab selector */}
      <View style={[styles.tabs, { backgroundColor: c.card, borderColor: c.border }]}>
        <TouchableOpacity
          style={[styles.tab, isSmsTab && { backgroundColor: c.primary }]}
          onPress={() => { haptic.selection(); setTab('sms'); }}>
          <Text style={[styles.tabText, { color: isSmsTab ? '#fff' : c.textSecondary }]}>
            📱 SMS Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isGmailTab && { backgroundColor: c.primary }]}
          onPress={() => { haptic.selection(); setTab('gmail'); }}>
          <Text style={[styles.tabText, { color: isGmailTab ? '#fff' : c.textSecondary }]}>
            ✉️ Gmail
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={[styles.scanBtn, { backgroundColor: scanning ? c.border : c.primary }]}
        onPress={isSmsTab ? handleSmsScan : handleGmailScan}
        disabled={scanning}>
        {scanning
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.scanBtnText}>
              {isSmsTab ? '🔍 Scan SMS Inbox' : (googleAccessToken ? '🔍 Scan Gmail' : '🔑 Sign in & Scan Gmail')}
            </Text>}
      </TouchableOpacity>

      {/* Gmail error */}
      {isGmailTab && gmailError ? (
        <View style={[styles.errorCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <Text style={styles.errorText}>⚠️ {gmailError}</Text>
        </View>
      ) : null}

      {/* Results */}
      <ResultsSection
        scanned={scanned}
        bookings={bookings}
        added={added}
        onAdd={handleAdd}
      />

      {/* Privacy note */}
      <View style={[styles.privacyNote, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.privacyTitle, { color: c.text }]}>🔒 Privacy First</Text>
        <Text style={[styles.privacyText, { color: c.textSecondary }]}>
          {isSmsTab
            ? 'ReadyToFly reads SMS only when you tap "Scan". Messages are parsed entirely on your device using pattern matching. We never store or transmit your SMS content.'
            : 'ReadyToFly uses Gmail\'s read-only API to search your inbox for airline emails. Only booking confirmation emails are scanned. We never store or transmit your email content.'}
        </Text>
      </View>
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

  headerCard:  { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  headerSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  tabs:    { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 14, gap: 4 },
  tab:     { flex: 1, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },

  scanBtn:     { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  resultsLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },

  card:      { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  airlineBadge:     { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  airlineBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  cardInfo:  { flex: 1 },
  flightNum: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  pnrText:   { fontSize: 13, marginBottom: 1 },
  dateText:  { fontSize: 12 },
  confBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  confText:  { fontSize: 11, fontWeight: '700' },

  addBtn:     { borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addedBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addedText:  { color: '#065F46', fontSize: 13, fontWeight: '600' },

  emptyCard:  { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  errorCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#DC2626', lineHeight: 19 },

  privacyNote:  { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 8 },
  privacyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  privacyText:  { fontSize: 12, lineHeight: 18 },
});
