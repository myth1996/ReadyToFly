/**
 * CoTravellerScreen — Share your flight tracking with family
 *
 * Free:    6-digit code — family enters it in their ReadyToFly app
 * Premium: WhatsApp share link — family tracks in browser, no app needed
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { AIRPORTS } from '../data/airports';
import {
  CoTravelCode,
  createCoTravelCode,
  lookupCoTravelCode,
  shareViaWhatsApp,
  deleteCoTravelCode,
  getShareUrl,
} from '../services/CoTravellerService';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';

export function CoTravellerScreen() {
  const { user, isPremiumUser } = useAuth();
  const { nextFlight } = useFlights();
  const { themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  // Interstitial on screen focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, nextFlight));
    });
    return unsub;
  }, [navigation, isPremiumUser, nextFlight]);

  const [myCode, setMyCode]       = useState<CoTravelCode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [tracking, setTracking]   = useState(false);
  const [copied, setCopied]       = useState(false);

  const generateCode = async () => {
    if (!user?.uid || !nextFlight) {
      Alert.alert('Add a flight first', 'Add your upcoming flight in "My Flights" to generate a tracking code.');
      return;
    }
    setGenerating(true);
    haptic.impact();
    const code = await createCoTravelCode({
      uid: user.uid,
      flightIata: nextFlight.flightIata,
      depIata: nextFlight.dep.iata,
      arrIata: nextFlight.arr.iata,
    });
    setMyCode(code);
    setGenerating(false);
  };

  const handleCopyCode = () => {
    if (!myCode) { return; }
    Clipboard.setString(myCode.code);
    haptic.selection();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!myCode) { return; }
    shareViaWhatsApp(myCode.code, myCode.flightIata, myCode.depIata, myCode.arrIata);
  };

  const handleTrackFlight = async () => {
    const code = trackInput.trim().toUpperCase();
    if (code.length !== 6) { Alert.alert('Enter a 6-character code'); return; }
    setTracking(true);
    const result = await lookupCoTravelCode(code);
    setTracking(false);
    if (!result) {
      Alert.alert('Code not found', 'This code is invalid or has expired (codes are valid for 48 hours).');
      return;
    }
    const dep = AIRPORTS[result.depIata]?.city ?? result.depIata;
    const arr = AIRPORTS[result.arrIata]?.city ?? result.arrIata;
    Alert.alert(
      `Tracking ${result.flightIata}`,
      `${dep} → ${arr}\n\nThis will open the flight details.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Track', onPress: () => {
          // Navigate to flight status (TripDashboard filtered)
          navigation.navigate('TripDashboard');
        }},
      ],
    );
  };

  const stopSharing = async () => {
    if (!myCode) { return; }
    await deleteCoTravelCode(myCode.code);
    setMyCode(null);
    haptic.success();
  };

  const expiresIn = myCode
    ? Math.max(0, Math.round((myCode.expiresAt - Date.now()) / (1000 * 60 * 60)))
    : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>

      {/* ── My Tracking Code section ─────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SHARE YOUR FLIGHT</Text>

      {nextFlight ? (
        <View style={[styles.flightPill, { backgroundColor: c.primary + '15', borderColor: c.primary }]}>
          <Text style={[styles.flightPillText, { color: c.primary }]}>
            ✈️  {nextFlight.flightIata}  ·  {nextFlight.dep.iata} → {nextFlight.arr.iata}
          </Text>
        </View>
      ) : (
        <View style={[styles.noFlightCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.noFlightText, { color: c.textSecondary }]}>
            Add an upcoming flight first to generate a tracking code.
          </Text>
        </View>
      )}

      {!myCode ? (
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: c.primary }]}
          onPress={generateCode}
          disabled={generating || !nextFlight}>
          {generating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.generateBtnText}>🔗 Generate Tracking Code</Text>
          }
        </TouchableOpacity>
      ) : (
        <View style={[styles.codeCard, { backgroundColor: c.card, borderColor: c.border }]}>
          {/* Code display */}
          <Text style={[styles.codeLabel, { color: c.textSecondary }]}>SHARE THIS CODE</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.codeBox}>
            <Text style={[styles.codeText, { color: c.primary }]}>{myCode.code}</Text>
            <Text style={[styles.copyHint, { color: c.textSecondary }]}>
              {copied ? '✅ Copied!' : 'Tap to copy'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.codeExpiry, { color: c.textSecondary }]}>
            ⏱️ Valid for {expiresIn}h more
          </Text>

          {/* Instructions */}
          <View style={[styles.instructionBox, { backgroundColor: c.background }]}>
            <Text style={[styles.instructionText, { color: c.textSecondary }]}>
              Family opens ReadyToFly → Co-traveller → Enter code → Sees your live flight status
            </Text>
          </View>

          {/* Premium: WhatsApp share */}
          {isPremiumUser ? (
            <TouchableOpacity
              style={[styles.waBtn, { backgroundColor: '#25D366' }]}
              onPress={handleWhatsAppShare}>
              <Text style={styles.waBtnText}>💬 Share via WhatsApp (with link)</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.premiumTeaser, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Text style={styles.premiumTeaserText}>
                👑 Premium: Send a WhatsApp link — family tracks in browser, no app needed
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
                <Text style={[styles.upgradeLink, { color: '#D97706' }]}>Upgrade →</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.stopBtn} onPress={stopSharing}>
            <Text style={[styles.stopBtnText, { color: '#EF4444' }]}>✕ Stop Sharing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Track someone else's flight ──────────────────────── */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: 24 }]}>TRACK A FAMILY MEMBER</Text>
      <View style={[styles.trackCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.trackInfo, { color: c.textSecondary }]}>
          Ask them for their 6-character ReadyToFly tracking code
        </Text>
        <TextInput
          style={[styles.codeInput, { color: c.text, borderColor: c.border }]}
          placeholder="Enter 6-char code (e.g. AB3K7X)"
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
          maxLength={6}
          value={trackInput}
          onChangeText={v => setTrackInput(v.toUpperCase())}
        />
        <TouchableOpacity
          style={[styles.trackBtn, { backgroundColor: c.primary }]}
          onPress={handleTrackFlight}
          disabled={tracking}>
          {tracking
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.trackBtnText}>Track Flight  →</Text>
          }
        </TouchableOpacity>
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
  content:   { padding: 16, paddingBottom: 50 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  flightPill:     { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14, alignItems: 'center' },
  flightPillText: { fontSize: 14, fontWeight: '700' },
  noFlightCard:   { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 14 },
  noFlightText:   { fontSize: 13, lineHeight: 18 },

  generateBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  codeCard:    { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  codeLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  codeBox:     { alignItems: 'center', paddingVertical: 12, marginBottom: 4 },
  codeText:    { fontSize: 40, fontWeight: '900', letterSpacing: 8 },
  copyHint:    { fontSize: 12, marginTop: 4 },
  codeExpiry:  { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  instructionBox: { borderRadius: 8, padding: 10, marginBottom: 14 },
  instructionText:{ fontSize: 12, lineHeight: 18, textAlign: 'center' },

  waBtn:     { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  waBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  premiumTeaser: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10 },
  premiumTeaserText: { color: '#92400E', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  upgradeLink:   { fontSize: 13, fontWeight: '700' },

  stopBtn:     { alignItems: 'center', paddingVertical: 8 },
  stopBtnText: { fontSize: 13, fontWeight: '600' },

  trackCard:  { borderRadius: 14, borderWidth: 1, padding: 16 },
  trackInfo:  { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  codeInput:  { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: 6, marginBottom: 12 },
  trackBtn:   { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  trackBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
