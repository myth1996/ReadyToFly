/**
 * ArrivalScreen — 4-card arrival hub
 *
 * Card 1: Baggage belt number (from AviationStack live data)
 * Card 2: Arrival checklist — Immigration, Baggage, Customs, Exit (sequential, animated)
 * Card 3: Exit guide — Google Maps link to airport taxi stand
 * Card 4: From-airport cab comparison (Uber/Ola/Rapido)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';
import { useFlightStatus } from '../hooks/useFlightStatus';
import { getCabOptions, openCab, logCabClick, requestLocationPermission, getCurrentPosition } from '../services/CabService';
import { fetchWeatherForAirport, WeatherResult } from '../services/WeatherService';
import { getDestinationCurrency, formatConversion } from '../services/CurrencyService';
import { AIRPORTS } from '../data/airports';
import { HomeStackParamList } from '../navigation/HomeStack';
import { haptic } from '../services/HapticService';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Arrival'>;
type RouteT  = RouteProp<HomeStackParamList, 'Arrival'>;

// ─── Checklist steps ──────────────────────────────────────────────────────────

const CHECKLIST_STEPS = [
  { id: 0, emoji: '🛂', label: 'Immigration / E-Gate', sub: 'Have passport + boarding pass ready' },
  { id: 1, emoji: '🧳', label: 'Baggage Claim',         sub: 'Collect your checked bags' },
  { id: 2, emoji: '🟢', label: 'Customs',               sub: 'Green channel if nothing to declare' },
  { id: 3, emoji: '🚪', label: 'Exit',                  sub: 'You\'re done! Welcome!' },
];

// ─── Animated checklist item ─────────────────────────────────────────────────

function CheckItem({
  step,
  done,
  active,
  onTap,
  themeColors,
}: {
  step: typeof CHECKLIST_STEPS[0];
  done: boolean;
  active: boolean;
  onTap: () => void;
  themeColors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const c = themeColors;

  const handlePress = () => {
    if (!active && !done) { return; }
    haptic.impact();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(onTap);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={active ? 0.7 : 1}>
      <Animated.View style={[
        styles.checkItem,
        { backgroundColor: done ? '#10B981' + '18' : active ? c.primary + '10' : c.background, borderColor: done ? '#10B981' : active ? c.primary : c.border, transform: [{ scale }] },
      ]}>
        <View style={[styles.checkCircleSmall, { backgroundColor: done ? '#10B981' : active ? c.primary : c.border }]}>
          <Text style={styles.checkCircleText}>{done ? '✓' : step.emoji}</Text>
        </View>
        <View style={styles.checkTextWrap}>
          <Text style={[styles.checkLabel, { color: done ? '#10B981' : active ? c.primary : c.textSecondary, fontWeight: active || done ? '700' : '500' }]}>
            {step.label}
          </Text>
          <Text style={[styles.checkSub, { color: c.textSecondary }]}>{step.sub}</Text>
        </View>
        {active && !done && <Text style={[styles.tapHint, { color: c.primary }]}>Tap →</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ArrivalScreen() {
  const route      = useRoute<RouteT>();
  const navigation = useNavigation<NavProp>();
  const { flightIata, arrIata } = route.params;
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();

  const [doneSteps, setDoneSteps]    = useState<number[]>([]);
  const [userCoords, setUserCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [bookingProvider, setBooking] = useState<string | null>(null);
  const [weather, setWeather]        = useState<WeatherResult | null>(null);
  const [currency, setCurrency]      = useState<{ currencyCode: string; symbol: string; name: string; rate: number } | null>(null);

  const { liveData, isLoading } = useFlightStatus(flightIata);

  const airport     = AIRPORTS[arrIata];
  const airportName = airport?.name ?? arrIata;
  const city        = airport?.city ?? arrIata;

  // Pre-fetch GPS + weather + currency in background
  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (granted) { setUserCoords(await getCurrentPosition()); }
    })();
    if (city) {
      fetchWeatherForAirport(arrIata, city).then(setWeather);
    }
    getDestinationCurrency(arrIata).then(setCurrency);
  }, [arrIata, city]);

  // Show interstitial ad on screen focus (free users only)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, null));
    });
    return unsub;
  }, [navigation, isPremiumUser]);

  const tickStep = (stepId: number) => {
    setDoneSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
  };

  const cabOptions = getCabOptions(userCoords, arrIata, 'from_airport');
  const cheapest   = cabOptions[0]; // already sorted cheapest first

  const handleCabBook = async () => {
    if (!cheapest) { return; }
    haptic.impact();
    setBooking(cheapest.provider);
    try {
      await logCabClick(user?.uid ?? null, cheapest.provider, cheapest.rideType, 'from_airport', arrIata, cheapest.fareMin);
      await openCab(cheapest);
    } catch {
      Alert.alert('Could not open app', 'Please install the cab app and try again.');
    } finally {
      setBooking(null);
    }
  };

  const openMaps = () => {
    const q = encodeURIComponent(`taxi stand ${airportName}`);
    Linking.openURL(`https://maps.google.com?q=${q}`);
  };

  const progressPct = CHECKLIST_STEPS.length > 0
    ? Math.round((doneSteps.length / CHECKLIST_STEPS.length) * 100)
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── CARD 1: Baggage Belt ────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>🧳 Baggage Belt</Text>
        {isLoading
          ? <ActivityIndicator color={c.primary} style={{ marginTop: 10 }} />
          : liveData?.baggageBelt
            ? (
              <>
                <Text style={[styles.beltNumber, { color: c.primary }]}>
                  Belt {liveData.baggageBelt}
                </Text>
                <Text style={[styles.beltSub, { color: c.textSecondary }]}>
                  {flightIata} · {city}
                </Text>
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>🟢 LIVE</Text>
                </View>
              </>
            )
            : (
              <View style={[styles.beltUnknown, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Text style={styles.beltUnknownText}>
                  ⚠️ Belt number not yet available — check the arrivals board
                </Text>
              </View>
            )
        }
        {liveData?.arrTerminal && (
          <Text style={[styles.terminalText, { color: c.textSecondary }]}>
            Arrival Terminal {liveData.arrTerminal}
            {liveData.arrGate ? `  ·  Gate ${liveData.arrGate}` : ''}
          </Text>
        )}
      </View>

      {/* ── CARD 2: Arrival Checklist ───────────────────────────── */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.checklistHeader}>
          <Text style={[styles.cardTitle, { color: c.text }]}>📋 Arrival Checklist</Text>
          <Text style={[styles.progressText, { color: c.primary }]}>
            {doneSteps.length}/{CHECKLIST_STEPS.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: c.border }]}>
          <Animated.View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: '#10B981' }]} />
        </View>

        {CHECKLIST_STEPS.map((step) => {
          const done   = doneSteps.includes(step.id);
          const active = !done && (step.id === 0 || doneSteps.includes(step.id - 1));
          return (
            <CheckItem
              key={step.id}
              step={step}
              done={done}
              active={active}
              onTap={() => tickStep(step.id)}
              themeColors={c}
            />
          );
        })}

        {doneSteps.length === CHECKLIST_STEPS.length && (
          <View style={styles.allDone}>
            <Text style={styles.allDoneText}>🎉 All done! Enjoy your destination!</Text>
          </View>
        )}
      </View>

      {/* ── CARD 3: Exit Guide ──────────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>🗺️ Exit Guide</Text>
        <Text style={[styles.cardSub, { color: c.textSecondary }]}>
          Find the taxi stand, metro, or bus at {airportName}
        </Text>
        <TouchableOpacity
          style={[styles.mapsBtn, { backgroundColor: '#4285F4' }]}
          onPress={openMaps}>
          <Text style={styles.mapsBtnText}>🗺️ Open in Google Maps  →</Text>
        </TouchableOpacity>
      </View>

      {/* ── CARD 4: Destination Weather ─────────────────────────── */}
      {weather ? (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>🌤️ Weather in {city}</Text>
          <View style={styles.weatherRow}>
            <Text style={styles.weatherEmoji}>{weather.emoji}</Text>
            <View style={styles.weatherMain}>
              <Text style={[styles.weatherTemp, { color: c.text }]}>{weather.tempC}°C</Text>
              <Text style={[styles.weatherDesc, { color: c.textSecondary }]}>{weather.description}</Text>
              <Text style={[styles.weatherFeels, { color: c.textSecondary }]}>
                Feels like {weather.feelsLikeC}°C
              </Text>
            </View>
            <View style={styles.weatherStats}>
              <Text style={[styles.weatherStat, { color: c.textSecondary }]}>💧 {weather.humidity}%</Text>
              <Text style={[styles.weatherStat, { color: c.textSecondary }]}>💨 {weather.windKph} km/h</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* ── CARD 5: Currency Exchange ────────────────────────────── */}
      {currency ? (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>💱 Currency in {city}</Text>
          <View style={styles.currencyRow}>
            <View style={styles.currencyMain}>
              <Text style={[styles.currencyRate, { color: c.primary }]}>
                1 INR = {currency.symbol}{currency.rate < 1 ? currency.rate.toFixed(4) : currency.rate.toFixed(2)}
              </Text>
              <Text style={[styles.currencyName, { color: c.textSecondary }]}>{currency.name}</Text>
            </View>
            <View style={[styles.currencyExamples, { backgroundColor: c.background }]}>
              {[100, 500, 1000, 5000].map(inr => (
                <View key={inr} style={styles.currencyExRow}>
                  <Text style={[styles.currencyExInr, { color: c.textSecondary }]}>₹{inr.toLocaleString()}</Text>
                  <Text style={[styles.currencyExArrow, { color: c.textSecondary }]}>→</Text>
                  <Text style={[styles.currencyExDest, { color: c.text }]}>
                    {formatConversion(inr, currency.rate, currency.symbol)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.currencyNote, { color: c.textSecondary }]}>
            ECB rates · Approx. only · Updated every 6h
          </Text>
        </View>
      ) : null}

      {/* ── CARD 6: From-Airport Cab ────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>🚕 Book Cab from Airport</Text>
        <Text style={[styles.cardSub, { color: c.textSecondary }]}>
          Pickup: {airportName}  ·  Drop: Your destination
        </Text>

        {cabOptions.map((opt) => {
          const isCheapest   = cheapest && opt.provider === cheapest.provider && opt.rideType === cheapest.rideType;
          const key          = `${opt.provider}-${opt.rideType}`;
          const isBookingNow = bookingProvider === key;

          return (
            <View
              key={key}
              style={[
                styles.miniCabCard,
                { backgroundColor: c.background, borderColor: isCheapest ? '#10B981' : c.border },
              ]}>
              <Text style={styles.miniCabEmoji}>{opt.emoji}</Text>
              <View style={styles.miniCabInfo}>
                <Text style={[styles.miniCabName, { color: c.text }]}>{opt.label} {opt.rideType}</Text>
                <Text style={[styles.miniCabFare, { color: c.textSecondary }]}>
                  ₹{opt.fareMin}–{opt.fareMax}  ·  {opt.etaMin}–{opt.etaMax} min
                </Text>
              </View>
              {isCheapest && (
                <View style={styles.miniCheapBadge}>
                  <Text style={styles.miniCheapText}>BEST</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.miniBookBtn, { backgroundColor: c.primary }]}
                onPress={() => { setBooking(key); openCab(opt).catch(() => {}); }}
                disabled={isBookingNow}>
                {isBookingNow
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.miniBookBtnText}>Book</Text>
                }
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* ── CARD 7: Hotel Affiliate ─────────────────────────────── */}
      <TouchableOpacity
        style={[styles.hotelCard, { backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]}
        onPress={() => {
          haptic.selection();
          const cityEncoded = encodeURIComponent(city);
          Linking.openURL(
            `https://www.makemytrip.com/hotels/hotel-listing/?checkin=01012025&checkout=02012025&city=${cityEncoded}&utm_source=readytofly&utm_medium=app&utm_campaign=arrival`
          );
          // Log affiliate click
          firestore().collection('affiliate_clicks').add({
            uid: user?.uid ?? 'anonymous',
            provider: 'hotel',
            direction: 'from_airport',
            airportIata: arrIata,
            clickedAt: firestore.FieldValue.serverTimestamp(),
          }).catch(() => {});
        }}
        activeOpacity={0.8}>
        <View style={styles.hotelLeft}>
          <Text style={styles.hotelEmoji}>🏨</Text>
          <View style={styles.hotelText}>
            <Text style={styles.hotelTitle}>Need a hotel in {city}?</Text>
            <Text style={styles.hotelSub}>Find the best deals on MakeMyTrip</Text>
            <View style={styles.hotelBadge}>
              <Text style={styles.hotelBadgeText}>Powered by MakeMyTrip</Text>
            </View>
          </View>
        </View>
        <Text style={styles.hotelChevron}>›</Text>
      </TouchableOpacity>

      {/* ── Bottom Banner Ad (free users) ─────────────────────── */}
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

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },

  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  cardSub:   { fontSize: 13, marginBottom: 12, lineHeight: 18 },

  // Baggage
  beltNumber:      { fontSize: 48, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  beltSub:         { textAlign: 'center', fontSize: 13, marginBottom: 8 },
  livePill:        { alignSelf: 'center', backgroundColor: '#D1FAE5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  livePillText:    { color: '#065F46', fontSize: 12, fontWeight: '700' },
  beltUnknown:     { borderRadius: 8, borderWidth: 1, padding: 12 },
  beltUnknownText: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  terminalText:    { textAlign: 'center', fontSize: 12, marginTop: 8 },

  // Checklist
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressText:    { fontSize: 14, fontWeight: '800' },
  progressBar:     { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill:    { height: '100%', borderRadius: 3 },
  checkItem:       { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  checkCircleSmall:{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkCircleText: { color: '#fff', fontSize: 16 },
  checkTextWrap:   { flex: 1 },
  checkLabel:      { fontSize: 14 },
  checkSub:        { fontSize: 11, marginTop: 2 },
  tapHint:         { fontSize: 12, fontWeight: '700' },
  allDone:         { backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  allDoneText:     { color: '#065F46', fontSize: 14, fontWeight: '700' },

  // Exit guide
  mapsBtn:     { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  mapsBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Weather
  weatherRow:   { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  weatherEmoji: { fontSize: 52, marginRight: 16 },
  weatherMain:  { flex: 1 },
  weatherTemp:  { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  weatherDesc:  { fontSize: 14, fontWeight: '600', marginTop: 2 },
  weatherFeels: { fontSize: 12, marginTop: 2 },
  weatherStats: { alignItems: 'flex-end', gap: 6 },
  weatherStat:  { fontSize: 13, fontWeight: '600' },

  // Currency
  currencyRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  currencyMain:     { flex: 1 },
  currencyRate:     { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  currencyName:     { fontSize: 12 },
  currencyExamples: { borderRadius: 8, padding: 10, gap: 6 },
  currencyExRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyExInr:    { fontSize: 12, width: 50, textAlign: 'right' },
  currencyExArrow:  { fontSize: 12 },
  currencyExDest:   { fontSize: 12, fontWeight: '700', minWidth: 60 },
  currencyNote:     { fontSize: 11, marginTop: 10 },

  // Hotel affiliate
  hotelCard:        { marginBottom: 16, borderRadius: 14, borderWidth: 1.5, padding: 14, flexDirection: 'row', alignItems: 'center' },
  hotelLeft:        { flex: 1, flexDirection: 'row', alignItems: 'center' },
  hotelEmoji:       { fontSize: 28, marginRight: 12 },
  hotelText:        { flex: 1 },
  hotelTitle:       { fontSize: 15, fontWeight: '800', color: '#15803D', marginBottom: 2 },
  hotelSub:         { fontSize: 12, color: '#166534', lineHeight: 16, marginBottom: 6 },
  hotelBadge:       { backgroundColor: '#BBF7D0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  hotelBadgeText:   { fontSize: 10, fontWeight: '700', color: '#14532D' },
  hotelChevron:     { fontSize: 22, color: '#22C55E', fontWeight: '300' },

  // Mini cab cards
  miniCabCard:      { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 8 },
  miniCabEmoji:     { fontSize: 22, marginRight: 10 },
  miniCabInfo:      { flex: 1 },
  miniCabName:      { fontSize: 14, fontWeight: '700' },
  miniCabFare:      { fontSize: 11, marginTop: 2 },
  miniCheapBadge:   { backgroundColor: '#10B981', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  miniCheapText:    { color: '#fff', fontSize: 10, fontWeight: '800' },
  miniBookBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  miniBookBtnText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
});
