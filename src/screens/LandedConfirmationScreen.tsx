/**
 * LandedConfirmationScreen — Auto-shown when landing is detected
 *
 * Shows animated green checkmark, sends Landed Safely messages to contacts,
 * lists send status per contact.
 * Buttons: View Baggage Info → ArrivalScreen, Share Arrival.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  getContacts,
  getMessageTemplate,
  sendLandedMessages,
  SendResult,
} from '../services/LandedSafelyService';
import { AIRPORTS } from '../data/airports';
import { HomeStackParamList } from '../navigation/HomeStack';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';

type NavProp   = NativeStackNavigationProp<HomeStackParamList, 'LandedConfirmation'>;
type RouteT    = RouteProp<HomeStackParamList, 'LandedConfirmation'>;

// ─── Animated checkmark ───────────────────────────────────────────────────────

function AnimatedCheck({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View style={[styles.checkCircle, { backgroundColor: color, transform: [{ scale }], opacity }]}>
      <Text style={styles.checkMark}>✓</Text>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function LandedConfirmationScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteT>();
  const { arrIata, flightIata } = route.params;
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c }      = useSettings();

  const [results, setResults]   = useState<SendResult[]>([]);
  const [sending, setSending]   = useState(true);

  const city = AIRPORTS[arrIata]?.city ?? arrIata;

  // Send messages on mount
  useEffect(() => {
    haptic.success();
    if (!user?.uid) { setSending(false); return; }
    (async () => {
      const [contacts, template] = await Promise.all([
        getContacts(user.uid!),
        getMessageTemplate(user.uid!),
      ]);
      if (contacts.length === 0) { setSending(false); return; }
      const res = await sendLandedMessages({
        uid: user.uid,
        isPremium: isPremiumUser,
        arrIata,
        senderName: user.phoneNumber ?? 'Me',
        contacts,
        template,
      });
      setResults(res);
      setSending(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I have arrived in ${city}! ✈️ — via ReadyToFly`,
      });
    } catch {}
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Checkmark */}
      <View style={styles.checkWrap}>
        <AnimatedCheck color="#10B981" />
        <Text style={[styles.landedTitle, { color: c.text }]}>
          You've landed in {city}! ✈️
        </Text>
        <Text style={[styles.landedSub, { color: c.textSecondary }]}>
          {flightIata} · Welcome to your destination
        </Text>
      </View>

      {/* Landed Safely status */}
      <View style={[styles.notifyCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.notifyTitle, { color: c.text }]}>🛡️ Landed Safely Notifications</Text>

        {sending && (
          <View style={styles.sendingRow}>
            <ActivityIndicator color={c.primary} size="small" />
            <Text style={[styles.sendingText, { color: c.textSecondary }]}>Sending messages…</Text>
          </View>
        )}

        {!sending && results.length === 0 && (
          <View style={styles.noContactsRow}>
            <Text style={[styles.noContactsText, { color: c.textSecondary }]}>
              No contacts set up.{' '}
              <Text style={{ color: c.primary }} onPress={() => navigation.navigate('LandedSafelySetup')}>
                Set up now →
              </Text>
            </Text>
          </View>
        )}

        {results.map((r, i) => (
          <View key={i} style={[styles.resultRow, { borderBottomColor: c.border }]}>
            <Text style={styles.resultIcon}>{r.success ? '✅' : '❌'}</Text>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultName, { color: c.text }]}>{r.contactName}</Text>
              <Text style={[styles.resultStatus, { color: c.textSecondary }]}>
                {r.channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}
                {r.deepLinkOpened ? ' — tap Send in WhatsApp' : ''}
                {!r.success ? ' — failed' : ''}
              </Text>
            </View>
          </View>
        ))}

        {results.some(r => !r.success) && (
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: c.primary }]}
            onPress={() => navigation.navigate('LandedSafelySetup')}>
            <Text style={[styles.retryText, { color: c.primary }]}>Retry Failed ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: c.primary }]}
        onPress={() => { haptic.impact(); navigation.navigate('Arrival', { flightIata, arrIata }); }}>
        <Text style={styles.primaryBtnText}>🧳 View Baggage & Arrival Info  →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: c.border }]}
        onPress={handleShare}>
        <Text style={[styles.secondaryBtnText, { color: c.text }]}>📤 Share Arrival</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: c.border }]}
        onPress={() => navigation.navigate('CabCompare', { direction: 'from_airport', airportIata: arrIata })}>
        <Text style={[styles.secondaryBtnText, { color: c.text }]}>🚕 Book Cab from Airport</Text>
      </TouchableOpacity>

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
  content:   { padding: 24, paddingBottom: 50, alignItems: 'center' },

  checkWrap:    { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  checkCircle:  { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 6 },
  checkMark:    { color: '#fff', fontSize: 52, fontWeight: '900' },
  landedTitle:  { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  landedSub:    { fontSize: 14, textAlign: 'center' },

  notifyCard:  { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  notifyTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },

  sendingRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  sendingText:    { fontSize: 14 },
  noContactsRow:  { paddingVertical: 8 },
  noContactsText: { fontSize: 14, lineHeight: 20 },

  resultRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  resultIcon:   { fontSize: 20, marginRight: 12 },
  resultInfo:   { flex: 1 },
  resultName:   { fontSize: 14, fontWeight: '700' },
  resultStatus: { fontSize: 12, marginTop: 2 },

  retryBtn:  { marginTop: 10, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  retryText: { fontSize: 13, fontWeight: '700' },

  primaryBtn:     { width: '100%', backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn:   { width: '100%', borderRadius: 14, borderWidth: 1, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
