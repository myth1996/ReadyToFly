/**
 * CabCompareScreen — Multi-platform cab fare comparison
 *
 * Fare logic ported from Comparify/FirstPaisa:
 * Haversine distance × per-km rate per platform, multiple ride types,
 * sorted cheapest first. Deep-link booking with GPS pre-fill.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';
import { useSettings } from '../context/SettingsContext';
import { AIRPORTS } from '../data/airports';
import {
  getCabOptions,
  openCab,
  logCabClick,
  requestLocationPermission,
  getCurrentPosition,
  CabOption,
  CabDirection,
} from '../services/CabService';
import { haptic } from '../services/HapticService';
import { HomeStackParamList } from '../navigation/HomeStack';

type RouteT = RouteProp<HomeStackParamList, 'CabCompare'>;

// Platform display names
const PLATFORM_LABEL: Record<string, string> = {
  uber: 'Uber', ola: 'Ola', rapido: 'Rapido', namma_yatri: 'Namma Yatri',
};

export function CabCompareScreen() {
  const route = useRoute<RouteT>();
  const { direction, airportIata } = route.params;
  const { user, isPremiumUser } = useAuth();
  const navigation = useNavigation<any>();
  const { themeColors: c } = useSettings();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [bookingKey, setBookingKey] = useState<string | null>(null);

  const airportEntry = AIRPORTS[airportIata];
  const airportLabel = airportEntry
    ? `${airportEntry.name} (${airportIata})`
    : airportIata;

  const pickupLabel = direction === 'to_airport' ? 'Your Location' : airportLabel;
  const dropLabel   = direction === 'to_airport' ? airportLabel    : 'Your Destination';

  // Compute options with actual haversine distance once coords are available
  const options = getCabOptions(userCoords, airportIata, direction);
  const cheapestFare = options[0]?.fareMin ?? Infinity;

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, null));
    });
    return unsub;
  }, [navigation, isPremiumUser]);

  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        const coords = await getCurrentPosition();
        setUserCoords(coords);
      }
      setLocLoading(false);
    })();
  }, []);

  const handleBook = async (opt: CabOption) => {
    const key = `${opt.provider}-${opt.rideType}`;
    haptic.impact();
    setBookingKey(key);
    try {
      await logCabClick(user?.uid ?? null, opt.provider, opt.rideType, direction, airportIata, opt.fareMin);
      await openCab(opt);
    } catch {
      Alert.alert('Could not open app', 'Please install the cab app and try again.');
    } finally {
      setBookingKey(null);
    }
  };

  // Group options by provider for section headers
  const byProvider = options.reduce<Record<string, CabOption[]>>((acc, opt) => {
    if (!acc[opt.provider]) { acc[opt.provider] = []; }
    acc[opt.provider].push(opt);
    return acc;
  }, {});

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Route Summary ── */}
      <View style={[styles.routeCard, { backgroundColor: c.primary }]}>
        <Text style={styles.routeDirection}>
          {direction === 'to_airport' ? '🏠 → ✈️  To Airport' : '✈️ → 🏠  From Airport'}
        </Text>
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <Text style={styles.routePointLabel}>FROM</Text>
            <Text style={styles.routePointValue} numberOfLines={2}>{pickupLabel}</Text>
          </View>
          <Text style={styles.routeArrow}>→</Text>
          <View style={[styles.routePoint, styles.routePointRight]}>
            <Text style={styles.routePointLabel}>TO</Text>
            <Text style={styles.routePointValue} numberOfLines={2}>{dropLabel}</Text>
          </View>
        </View>

        {locLoading && (
          <View style={styles.locRow}>
            <ActivityIndicator color="rgba(255,255,255,0.8)" size="small" />
            <Text style={styles.locStatus}>Getting your location…</Text>
          </View>
        )}
        {!locLoading && !userCoords && (
          <Text style={styles.locStatus}>⚠️ Location unavailable — fares based on avg distance</Text>
        )}
        {!locLoading && userCoords && (
          <Text style={styles.locStatus}>📍 GPS fares — sorted cheapest first</Text>
        )}
      </View>

      {/* ── Ride Cards — sorted cheapest first ── */}
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
        {options.length} RIDE OPTIONS · CHEAPEST FIRST
      </Text>

      {options.map((opt) => {
        const isCheapest = opt.fareMin === cheapestFare;
        const isBooking  = bookingKey === `${opt.provider}-${opt.rideType}`;
        const textColor  = opt.color === '#FFD600' ? '#000' : '#fff';

        return (
          <View
            key={`${opt.provider}-${opt.rideType}`}
            style={[
              styles.cabCard,
              { backgroundColor: c.card, borderColor: isCheapest ? '#10B981' : c.border },
              isCheapest && { borderWidth: 2 },
            ]}>

            {isCheapest && (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>✓ BEST PRICE</Text>
              </View>
            )}

            <View style={styles.cabCardTop}>
              <View style={[styles.emojiWrap, { backgroundColor: opt.color + '20' }]}>
                <Text style={styles.cabEmoji}>{opt.emoji}</Text>
              </View>

              <View style={styles.cabInfo}>
                <View style={styles.cabNameRow}>
                  <Text style={[styles.cabName, { color: c.text }]}>
                    {PLATFORM_LABEL[opt.provider] ?? opt.label}
                  </Text>
                  <View style={[styles.rideTypeBadge, { backgroundColor: opt.color + '20' }]}>
                    <Text style={[styles.rideTypeText, { color: opt.color === '#FFD600' ? '#856500' : opt.color }]}>
                      {opt.rideType}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cabEta, { color: c.textSecondary }]}>
                  🕐 {opt.etaMin}–{opt.etaMax} min away
                </Text>
              </View>

              <View style={styles.cabFareWrap}>
                <Text style={[styles.cabFare, { color: c.text }]}>
                  ₹{opt.fareMin}–{opt.fareMax}
                </Text>
                <Text style={[styles.cabFareLabel, { color: c.textSecondary }]}>est. fare</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: opt.color }]}
              onPress={() => handleBook(opt)}
              disabled={isBooking}
              activeOpacity={0.85}>
              {isBooking
                ? <ActivityIndicator color={textColor} size="small" />
                : <Text style={[styles.bookBtnText, { color: textColor }]}>
                    Book {PLATFORM_LABEL[opt.provider]} {opt.rideType}  →
                  </Text>
              }
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Estimates based on {userCoords ? 'your GPS location' : 'average distance'}.
        Actual fares may vary with surge pricing. Fares shown in INR.
      </Text>

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
  content: { padding: 16, paddingBottom: 40 },

  routeCard: { borderRadius: 14, padding: 16, marginBottom: 20 },
  routeDirection: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routePoint: { flex: 1 },
  routePointRight: { alignItems: 'flex-end' },
  routePointLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  routePointValue: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 2 },
  routeArrow: { color: 'rgba(255,255,255,0.7)', fontSize: 20, marginHorizontal: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  locStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 10 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  cabCard: { borderRadius: 14, borderWidth: 1.5, marginBottom: 12, overflow: 'hidden' },
  bestBadge: {
    backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', borderBottomRightRadius: 10,
  },
  bestBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  cabCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  emojiWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cabEmoji: { fontSize: 22 },
  cabInfo: { flex: 1, gap: 4 },
  cabNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cabName: { fontSize: 16, fontWeight: '800' },
  rideTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rideTypeText: { fontSize: 11, fontWeight: '700' },
  cabEta: { fontSize: 12 },
  cabFareWrap: { alignItems: 'flex-end' },
  cabFare: { fontSize: 16, fontWeight: '800' },
  cabFareLabel: { fontSize: 11, marginTop: 2 },

  bookBtn: { marginHorizontal: 14, marginBottom: 14, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  bookBtnText: { fontSize: 14, fontWeight: '800' },

  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
