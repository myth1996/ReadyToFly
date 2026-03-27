/**
 * CabCompareScreen — Uber / Ola / Rapido comparison
 *
 * Shows 3 cab cards with estimated fare ranges and ETA.
 * Cheapest option highlighted with a green badge.
 * On Book: GPS pickup → deep link → Firestore click log.
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
  CabProvider,
  CabDirection,
} from '../services/CabService';
import { haptic } from '../services/HapticService';
import { HomeStackParamList } from '../navigation/HomeStack';

type RouteT = RouteProp<HomeStackParamList, 'CabCompare'>;

export function CabCompareScreen() {
  const route = useRoute<RouteT>();
  const { direction, airportIata } = route.params;
  const { user, isPremiumUser } = useAuth();
  const navigation = useNavigation<any>();
  const { themeColors: c } = useSettings();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [bookingProvider, setBookingProvider] = useState<CabProvider | null>(null);

  const airportEntry = AIRPORTS[airportIata];
  const airportLabel = airportEntry
    ? `${airportEntry.name} (${airportIata})`
    : airportIata;

  const options   = getCabOptions();
  const cheapest  = options.reduce((a, b) => a.fareMin < b.fareMin ? a : b);

  const pickupLabel = direction === 'to_airport' ? 'Your Location' : airportLabel;
  const dropLabel   = direction === 'to_airport' ? airportLabel    : 'Your Destination';

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

  const handleBook = async (provider: CabProvider) => {
    haptic.impact();
    setBookingProvider(provider);
    try {
      await logCabClick(user?.uid ?? null, provider, direction, airportIata);
      await openCab(provider, airportIata, direction, userCoords);
    } catch {
      Alert.alert('Could not open app', 'Please install Uber, Ola, or Rapido and try again.');
    } finally {
      setBookingProvider(null);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Route summary */}
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
          <Text style={styles.locStatus}>📍 Getting your location…</Text>
        )}
        {!locLoading && !userCoords && (
          <Text style={styles.locStatus}>⚠️ Location unavailable — pickup may need manual entry</Text>
        )}
        {!locLoading && userCoords && (
          <Text style={styles.locStatus}>📍 Location ready</Text>
        )}
      </View>

      {/* Cab cards */}
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
        CHOOSE YOUR RIDE
      </Text>

      {options.map((opt) => {
        const isCheapest = opt.provider === cheapest.provider;
        const isBooking  = bookingProvider === opt.provider;

        return (
          <View
            key={opt.provider}
            style={[
              styles.cabCard,
              { backgroundColor: c.card, borderColor: isCheapest ? '#10B981' : c.border },
              isCheapest && styles.cabCardCheapest,
            ]}>

            {isCheapest && (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>✓ BEST PRICE</Text>
              </View>
            )}

            <View style={styles.cabCardTop}>
              <Text style={styles.cabEmoji}>{opt.emoji}</Text>
              <View style={styles.cabInfo}>
                <Text style={[styles.cabName, { color: c.text }]}>{opt.label}</Text>
                <Text style={[styles.cabEta, { color: c.textSecondary }]}>
                  {opt.etaMin}–{opt.etaMax} min away
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
              style={[styles.bookBtn, { backgroundColor: opt.color === '#FFD600' ? '#FFD600' : opt.color }]}
              onPress={() => handleBook(opt.provider)}
              disabled={isBooking}
              activeOpacity={0.85}>
              {isBooking
                ? <ActivityIndicator color={opt.color === '#FFD600' ? '#000' : '#fff'} size="small" />
                : <Text style={[styles.bookBtnText, { color: opt.color === '#FFD600' ? '#000' : '#fff' }]}>
                    Book {opt.label}  →
                  </Text>
              }
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        * Fare estimates based on ~15km distance. Actual fares depend on surge pricing and exact route.
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
  content:   { padding: 16, paddingBottom: 40 },

  routeCard:       { borderRadius: 14, padding: 16, marginBottom: 20 },
  routeDirection:  { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  routeRow:        { flexDirection: 'row', alignItems: 'center' },
  routePoint:      { flex: 1 },
  routePointRight: { alignItems: 'flex-end' },
  routePointLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  routePointValue: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 2 },
  routeArrow:      { color: 'rgba(255,255,255,0.7)', fontSize: 20, marginHorizontal: 12 },
  locStatus:       { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 10 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  cabCard:         { borderRadius: 14, borderWidth: 1.5, marginBottom: 14, overflow: 'hidden' },
  cabCardCheapest: { borderWidth: 2 },
  bestBadge:       { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', borderBottomRightRadius: 10 },
  bestBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cabCardTop:      { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cabEmoji:        { fontSize: 28, marginRight: 12 },
  cabInfo:         { flex: 1 },
  cabName:         { fontSize: 18, fontWeight: '800' },
  cabEta:          { fontSize: 12, marginTop: 2 },
  cabFareWrap:     { alignItems: 'flex-end' },
  cabFare:         { fontSize: 16, fontWeight: '800' },
  cabFareLabel:    { fontSize: 11, marginTop: 2 },
  bookBtn:         { marginHorizontal: 14, marginBottom: 14, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  bookBtnText:     { fontSize: 15, fontWeight: '800' },

  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
