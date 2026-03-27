/**
 * ArrivalShareCard — Shareable arrival card
 *
 * Free:    Text-only share via Share API
 * Premium: Beautiful image card (captured with react-native-view-shot)
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { haptic } from '../services/HapticService';
import { AIRPORTS } from '../data/airports';

interface Props {
  flightIata: string;
  arrIata: string;
  themeColors: any;
}

// Country flag emoji from IATA (rough mapping for major destinations)
const countryFlags: Record<string, string> = {
  IN: '🇮🇳', SG: '🇸🇬', AE: '🇦🇪', GB: '🇬🇧', US: '🇺🇸',
  AU: '🇦🇺', JP: '🇯🇵', TH: '🇹🇭', MY: '🇲🇾', FR: '🇫🇷',
  DE: '🇩🇪', QA: '🇶🇦', NL: '🇳🇱', CN: '🇨🇳', KR: '🇰🇷',
  HK: '🇭🇰', LK: '🇱🇰', NP: '🇳🇵', BD: '🇧🇩', CA: '🇨🇦',
};

function getFlag(country: string): string {
  return countryFlags[country] ?? '🌍';
}

export function ArrivalShareCard({ flightIata, arrIata, themeColors: c }: Props) {
  const { isPremiumUser } = useAuth();
  const navigation = useNavigation<any>();
  const shotRef = useRef<ViewShot>(null);

  const airport = AIRPORTS[arrIata];
  const city    = airport?.city ?? arrIata;
  const country = airport?.country ?? '';
  const flag    = getFlag(country.slice(0, 2).toUpperCase());
  const time    = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const shareText = async () => {
    haptic.impact();
    try {
      await Share.share({
        message: `${flag} I've arrived in ${city}! ✈️\nFlight ${flightIata} · ${date} · ${time}\n\n— Shared via ReadyToFly`,
      });
    } catch {}
  };

  const shareImage = async () => {
    if (!isPremiumUser) {
      Alert.alert(
        '👑 Premium Feature',
        'Image share cards are available for Premium users.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') },
        ],
      );
      return;
    }
    haptic.impact();
    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) { throw new Error('Capture failed'); }
      await Share.share({ url: uri, message: `${flag} Arrived in ${city}! ✈️ — via ReadyToFly` });
    } catch {
      // Fallback to text share
      await shareText();
    }
  };

  return (
    <View>
      {/* Card preview (always visible, captured for premium share) */}
      <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }}>
        <View style={styles.card}>
          <View style={[styles.cardInner, { backgroundColor: '#1A3C5E' }]}>
            <Text style={styles.cardFlag}>{flag}</Text>
            <Text style={styles.cardCity}>{city}</Text>
            <Text style={styles.cardTagline}>Arrived safely ✈️</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.cardFlight}>{flightIata}</Text>
            <Text style={styles.cardDate}>{date}  ·  {time}</Text>
            <Text style={styles.cardBranding}>ReadyToFly</Text>
          </View>
        </View>
      </ViewShot>

      {/* Share buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.textBtn, { borderColor: c.border }]} onPress={shareText}>
          <Text style={[styles.textBtnText, { color: c.text }]}>📤 Share Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageBtn, { backgroundColor: isPremiumUser ? c.primary : '#9CA3AF' }]}
          onPress={shareImage}>
          <Text style={styles.imageBtnText}>
            {isPremiumUser ? '🖼️ Share Image' : '👑 Image (Premium)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  cardInner:  { padding: 24, alignItems: 'center' },
  cardFlag:   { fontSize: 52, marginBottom: 8 },
  cardCity:   { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  cardTagline:{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 16 },
  cardDivider:{ width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 16 },
  cardFlight: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardDate:   { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16 },
  cardBranding: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 2, fontWeight: '700' },

  btnRow:      { flexDirection: 'row', gap: 10 },
  textBtn:     { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  textBtnText: { fontSize: 13, fontWeight: '700' },
  imageBtn:    { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  imageBtnText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
});
