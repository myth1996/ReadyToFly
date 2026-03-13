import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useFlights, getCountdown } from '../context/FlightsContext';
import { formatISOTime, statusLabel, statusColor, FlightData } from '../services/FlightService';
import { HomeStackParamList } from '../navigation/HomeStack';
import { haptic } from '../services/HapticService';
import { fetchWeatherForAirport, WeatherResult } from '../services/WeatherService';
import { AIRPORTS } from '../data/airports';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'TripDashboard'>;

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) { return 'Good morning'; }
  if (h < 17) { return 'Good afternoon'; }
  return 'Good evening';
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 6)  { return '🌙'; }
  if (h < 12) { return '☀️'; }
  if (h < 17) { return '🌤️'; }
  return '🌆';
}

// ─── Countdown urgency colour ─────────────────────────────────────────────────

function countdownBgColor(depISO: string, primary: string): string {
  const diff = new Date(depISO).getTime() - Date.now();
  if (diff < 0)            { return '#10B981'; } // green — boarding/departed
  if (diff < 2 * 3600_000) { return '#EF4444'; } // red — < 2 hrs
  if (diff < 6 * 3600_000) { return '#F59E0B'; } // amber — 2–6 hrs
  return primary;                                  // blue — plenty of time
}

// ─── Compact flight card (for "Other trips") ─────────────────────────────────

function MiniFlightCard({
  flight,
  onRemove,
  fadeIn,
}: {
  flight: FlightData;
  onRemove: () => void;
  fadeIn: Animated.Value;
}) {
  const depTime = formatISOTime(flight.dep.scheduledTime);
  const arrTime = formatISOTime(flight.arr.scheduledTime);
  const depDate = flight.dep.scheduledTime
    ? new Date(flight.dep.scheduledTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';
  const badgeColor = statusColor(flight.status);

  return (
    <Animated.View style={[mStyles.card, { opacity: fadeIn }]}>
      <View style={mStyles.top}>
        <View style={[mStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={mStyles.badgeText}>{statusLabel(flight.status)}</Text>
        </View>
        <Text style={mStyles.flightNum}>{flight.flightIata}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={mStyles.remove}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={mStyles.route}>
        <View>
          <Text style={mStyles.iata}>{flight.dep.iata}</Text>
          <Text style={mStyles.time}>{depTime}</Text>
        </View>
        <View style={mStyles.lineBox}>
          <View style={mStyles.dottedLine} />
          <Text style={mStyles.planeIcon}>✈</Text>
          <View style={mStyles.dottedLine} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[mStyles.iata, { color: '#1A56A6' }]}>{flight.arr.iata}</Text>
          <Text style={mStyles.time}>{arrTime}</Text>
        </View>
      </View>
      <Text style={mStyles.dateText}>{flight.airline}  ·  {depDate}</Text>
    </Animated.View>
  );
}

const mStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginRight: 14,
    width: 230,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  flightNum: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  remove: { fontSize: 14, color: '#9CA3AF' },
  route: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iata: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  time: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  lineBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  dottedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' },
  planeIcon: { fontSize: 16, color: '#1A56A6', marginHorizontal: 4 },
  dateText: { fontSize: 11, color: '#9CA3AF' },
});

// ─── Sponsored Mini Card (Native Ad) ─────────────────────────────────────────
// Renders at position 2 in the "Other Trips" horizontal scroll.
// Styled to match MiniFlightCard. Loads asynchronously; hidden until ready.

function SponsoredMiniCard({ visible }: { visible: boolean }) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (!visible) { return; }
    let cancelled = false;
    NativeAd.createForAdRequest(AD_UNIT_IDS.NATIVE)
      .then(ad => { if (!cancelled) { setNativeAd(ad); } })
      .catch(() => {}); // silent fail
    return () => { cancelled = true; };
  }, [visible]);

  if (!nativeAd) { return null; }

  return (
    <NativeAdView nativeAd={nativeAd} style={spStyles.card}>
      <View style={spStyles.sponsorRow}>
        <Text style={spStyles.sponsorLabel}>Sponsored</Text>
        {nativeAd.advertiser ? (
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <Text style={spStyles.advertiser} numberOfLines={1}>{nativeAd.advertiser}</Text>
          </NativeAsset>
        ) : null}
      </View>
      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text style={spStyles.headline} numberOfLines={2}>{nativeAd.headline}</Text>
      </NativeAsset>
      {nativeAd.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={spStyles.body} numberOfLines={2}>{nativeAd.body}</Text>
        </NativeAsset>
      ) : null}
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <View style={spStyles.ctaBtn}>
          <Text style={spStyles.ctaTxt}>{nativeAd.callToAction}</Text>
        </View>
      </NativeAsset>
    </NativeAdView>
  );
}

const spStyles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    marginRight: 14,
    width: 230,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sponsorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  sponsorLabel: { fontSize: 9, fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.8, backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  advertiser: { flex: 1, fontSize: 11, color: '#3B82F6', fontWeight: '600' },
  headline: { fontSize: 14, fontWeight: '800', color: '#1E3A5F', marginBottom: 6, lineHeight: 19 },
  body: { fontSize: 12, color: '#4B5563', lineHeight: 17, marginBottom: 10 },
  ctaBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function TripDashboardScreen() {
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c, t } = useSettings();
  const { flights, nextFlight, removeFlight, refreshAllFlights, isRefreshing } = useFlights();
  const navigation = useNavigation<NavProp>();

  // All-tools modal
  const [showAllTools, setShowAllTools] = useState(false);

  // Live countdown — ticks every 30 seconds
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Hero card entrance animation
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mini card fade-in anims
  const miniFades = useRef<Animated.Value[]>([]).current;
  useEffect(() => {
    while (miniFades.length < flights.length) {
      const anim = new Animated.Value(0);
      miniFades.push(anim);
      Animated.timing(anim, { toValue: 1, duration: 350, delay: miniFades.length * 80, useNativeDriver: true }).start();
    }
  }, [flights.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const otherFlights = nextFlight
    ? flights.filter(f => f !== nextFlight)
    : [];

  const phoneDisplay = user?.phoneNumber
    ? user.phoneNumber.replace('+91', '')
    : null;

  const countdown = nextFlight
    ? getCountdown(nextFlight.dep.scheduledTime)
    : null;

  const heroBg = nextFlight
    ? countdownBgColor(nextFlight.dep.scheduledTime, c.primary)
    : c.primary;

  // ── Weather for arrival airport ────────────────────────────────────────────
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  useEffect(() => {
    if (!nextFlight?.arr?.iata) { setWeather(null); return; }
    const arrEntry = AIRPORTS[nextFlight.arr.iata];
    if (!arrEntry) { return; }
    fetchWeatherForAirport(nextFlight.arr.iata, arrEntry.city)
      .then(w => setWeather(w))
      .catch(() => setWeather(null));
  }, [nextFlight?.arr?.iata]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Share trip ─────────────────────────────────────────────────────────────
  const handleShareTrip = useCallback(() => {
    if (!nextFlight) { return; }
    const depTime = formatISOTime(nextFlight.dep.scheduledTime);
    const arrTime = formatISOTime(nextFlight.arr.scheduledTime);
    const depDate = nextFlight.dep.scheduledTime
      ? new Date(nextFlight.dep.scheduledTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const lines = [
      `✈️ *${nextFlight.flightIata}* — ${depDate}`,
      `${nextFlight.dep.iata} (${depTime}) → ${nextFlight.arr.iata} (${arrTime})`,
      nextFlight.airline,
      nextFlight.pnr ? `PNR: ${nextFlight.pnr}` : '',
      nextFlight.dep.terminal ? `Terminal ${nextFlight.dep.terminal}` : '',
      nextFlight.arr.gate ? `Gate ${nextFlight.arr.gate}` : '',
      '',
      '_Shared via FlyEasy_',
    ].filter(Boolean).join('\n');
    Share.share({ message: lines, title: `Flight ${nextFlight.flightIata}` });
  }, [nextFlight]);

  // ── DigiYatra deep-link ─────────────────────────────────────────────────────
  const handleDigiYatra = () => {
    const pkg = 'in.co.aai.digiyatra';
    Linking.openURL(`intent://#Intent;package=${pkg};end`).catch(() =>
      Linking.openURL('https://play.google.com/store/apps/details?id=in.co.aai.digiyatra'),
    );
  };

  const quickTools = [
    { icon: '🕐', label: t.leaveByTitle,   onPress: () => navigation.navigate('LeaveBy') },
    { icon: '📋', label: t.docCheckTitle,  onPress: () => navigation.navigate('DocChecklist') },
    { icon: '🧳', label: 'Baggage',        onPress: () => navigation.navigate('BaggageRules') },
    { icon: '🛠️', label: 'All Tools',     onPress: () => setShowAllTools(true) },
  ];

  const allTools = [
    { icon: '🕐', label: 'Leave-By Time',    desc: 'When to leave for the airport',   locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('LeaveBy'); } },
    { icon: '📋', label: 'Doc Checklist',     desc: 'Passport, boarding pass & more',  locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('DocChecklist'); } },
    { icon: '🗺️', label: 'Airport Guide',     desc: 'Maps, lounges & facilities',     locked: false, onPress: () => { setShowAllTools(false); navigation.getParent()?.navigate('Airport Guide'); } },
    { icon: '😌', label: 'Calm Mode',         desc: '4-7-8 breathing for anxious flyers', locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('CalmMode'); } },
    { icon: '🧳', label: 'Baggage Rules',     desc: 'Allowances by airline',              locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('BaggageRules'); } },
    { icon: '🌍', label: 'Visa Info',         desc: 'Entry requirements by country',       locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('Visa'); } },
    { icon: '🏅', label: 'Frequent Flyer',   desc: 'Track your loyalty programmes',        locked: false, onPress: () => { setShowAllTools(false); navigation.navigate('FrequentFlyer'); } },
    { icon: '🔔', label: 'Flight Alerts',     desc: 'Delay & gate-change notifications',  locked: true,  onPress: undefined },
    { icon: '🍽️', label: 'Food & Lounge',    desc: 'Restaurants near your gate',          locked: true,  onPress: undefined },
    { icon: '💱', label: 'Currency',          desc: 'Live exchange rates at the airport',  locked: true,  onPress: undefined },
  ];

  const handleLostAtAirport = () => {
    haptic.heavy();
    Alert.alert(
      '🆘 Lost at Airport?',
      "Don't worry — here's what to do:\n\n1. Go to the nearest Information Desk\n2. Ask for your Terminal & Gate number\n3. Look for airline staff in uniform\n4. Call your airline helpline\n\nStay calm — airport staff are always there to help.",
      [{ text: 'Got it ✓', style: 'default' }],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshAllFlights}
          tintColor={c.primary}
          colors={[c.primary]}
        />
      }>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: c.text }]}>
            {getGreetingEmoji()}  {getGreeting()}
            {phoneDisplay ? `, +91 ${phoneDisplay}` : '!'}
          </Text>
          <Text style={[styles.subGreeting, { color: c.textSecondary }]}>
            {flights.length === 0
              ? 'Where are you flying next?'
              : `You have ${flights.length} trip${flights.length > 1 ? 's' : ''} tracked`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: c.card }]}
            onPress={() => { haptic.impact(); navigation.navigate('Search'); }}
            activeOpacity={0.75}>
            <Text style={styles.headerIconEmoji}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: c.primary }]}
            onPress={() => Alert.alert('Notifications', 'Flight alerts coming soon!')}
            activeOpacity={0.75}>
            <Text style={styles.headerIconEmoji}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
      {flights.length === 0 && (
        <Animated.View
          style={[
            styles.onboardCard,
            { backgroundColor: c.primary, opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}>
          {/* Decorative circles */}
          <View style={styles.deco1} />
          <View style={styles.deco2} />

          <Text style={styles.onboardEmoji}>✈️</Text>
          <Text style={styles.onboardTitle}>Your trips, all in one place</Text>
          <Text style={styles.onboardDesc}>
            Add a flight to get a live departure countdown, real-time gate updates, and instant delay alerts.
          </Text>
          <TouchableOpacity
            style={styles.onboardBtn}
            onPress={() => navigation.navigate('AddFlight')}>
            <Text style={styles.onboardBtnText}>+ Add Your First Flight</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── COUNTDOWN HERO ──────────────────────────────────────────── */}
      {nextFlight && countdown && (
        <Animated.View
          style={[
            styles.countdownCard,
            { backgroundColor: heroBg, opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}>
          <View style={styles.deco1} />
          <View style={styles.deco2} />

          <View style={styles.countdownTop}>
            <Text style={styles.nextLabel}>NEXT FLIGHT</Text>
            <Text style={styles.countdownFlightNum}>{nextFlight.flightIata}</Text>
          </View>

          <Text style={styles.departsIn}>
            {countdown.departed ? 'Departed' : 'Departs in'}
          </Text>
          <Text style={styles.countdown}>{countdown.text}</Text>

          <View style={styles.countdownRoute}>
            <View>
              <Text style={styles.countdownIata}>{nextFlight.dep.iata}</Text>
              <Text style={styles.countdownTime}>{formatISOTime(nextFlight.dep.scheduledTime)}</Text>
            </View>
            <Text style={styles.countdownPlane}>✈</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.countdownIata}>{nextFlight.arr.iata}</Text>
              <Text style={styles.countdownTime}>{formatISOTime(nextFlight.arr.scheduledTime)}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── NEXT FLIGHT STATUS CARD ──────────────────────────────────── */}
      {nextFlight && (
        <View style={[styles.statusCard, { backgroundColor: c.card }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(nextFlight.status) }]}>
              <Text style={styles.statusBadgeText}>{statusLabel(nextFlight.status)}</Text>
            </View>
            <Text style={[styles.statusFlightNum, { color: c.text }]}>{nextFlight.flightIata}</Text>
            <TouchableOpacity
              onPress={() => removeFlight(flights.indexOf(nextFlight))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.removeBtn, { color: c.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.statusAirline, { color: c.textSecondary }]}>
            {nextFlight.airline}
            {nextFlight.pnr ? `  ·  PNR: ${nextFlight.pnr}` : ''}
          </Text>

          <View style={[styles.statusDivider, { backgroundColor: c.border }]} />

          <View style={styles.statusRoute}>
            <View style={styles.statusEndpoint}>
              <Text style={[styles.statusIata, { color: c.text }]}>{nextFlight.dep.iata}</Text>
              <Text style={[styles.statusDepTime, { color: c.textSecondary }]}>
                {formatISOTime(nextFlight.dep.scheduledTime)}
              </Text>
              <Text style={[styles.statusAirportName, { color: c.textSecondary }]} numberOfLines={1}>
                {nextFlight.dep.airport}
              </Text>
            </View>
            <Text style={[styles.statusPlane, { color: c.primary }]}>✈</Text>
            <View style={[styles.statusEndpoint, { alignItems: 'flex-end' }]}>
              <Text style={[styles.statusIata, { color: c.primary }]}>{nextFlight.arr.iata}</Text>
              <Text style={[styles.statusDepTime, { color: c.textSecondary }]}>
                {formatISOTime(nextFlight.arr.scheduledTime)}
              </Text>
              <Text style={[styles.statusAirportName, { color: c.textSecondary, textAlign: 'right' }]} numberOfLines={1}>
                {nextFlight.arr.airport}
              </Text>
            </View>
          </View>

          {/* Gate / Terminal chips */}
          <View style={styles.chips}>
            {nextFlight.dep.terminal ? (
              <View style={[styles.chip, { backgroundColor: c.background }]}>
                <Text style={[styles.chipLabel, { color: c.text }]}>
                  🚪 Terminal {nextFlight.dep.terminal}
                </Text>
              </View>
            ) : null}
            {nextFlight.arr.gate ? (
              <View style={[styles.chip, { backgroundColor: c.primary + '18' }]}>
                <Text style={[styles.chipLabel, { color: c.primary }]}>
                  🔑 Gate {nextFlight.arr.gate}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Share + DigiYatra action row */}
          <View style={[styles.statusDivider, { backgroundColor: c.border, marginTop: 14 }]} />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.primary + '15' }]}
              onPress={handleShareTrip}
              activeOpacity={0.75}>
              <Text style={styles.actionBtnIcon}>📤</Text>
              <Text style={[styles.actionBtnLabel, { color: c.primary }]}>Share Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' + '15' }]}
              onPress={handleDigiYatra}
              activeOpacity={0.75}>
              <Text style={styles.actionBtnIcon}>🪪</Text>
              <Text style={[styles.actionBtnLabel, { color: '#10B981' }]}>DigiYatra</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── WEATHER AT DESTINATION ───────────────────────────────────── */}
      {nextFlight && weather && (
        <View style={[styles.weatherCard, { backgroundColor: c.card }]}>
          <View style={styles.weatherHeader}>
            <Text style={[styles.weatherTitle, { color: c.text }]}>
              {weather.emoji}  Weather at {nextFlight.arr.iata}
            </Text>
            <Text style={[styles.weatherTemp, { color: c.primary }]}>
              {weather.tempC}°C
            </Text>
          </View>
          <Text style={[styles.weatherDesc, { color: c.textSecondary }]}>
            {weather.description}  ·  Feels like {weather.feelsLikeC}°C
          </Text>
          <View style={styles.weatherChips}>
            <View style={[styles.chip, { backgroundColor: c.background }]}>
              <Text style={[styles.chipLabel, { color: c.text }]}>
                💧 {weather.humidity}% humidity
              </Text>
            </View>
            <View style={[styles.chip, { backgroundColor: c.background }]}>
              <Text style={[styles.chipLabel, { color: c.text }]}>
                💨 {weather.windKph} km/h
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── QUICK TOOLS ─────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Tools</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsRow}>
        {quickTools.map(tool => (
          <TouchableOpacity
            key={tool.label}
            style={[styles.toolPill, { backgroundColor: c.card }]}
            onPress={tool.onPress}
            activeOpacity={0.7}>
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <Text style={[styles.toolLabel, { color: c.text }]}>{tool.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── LOST AT AIRPORT SOS ─────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.sosCard}
        onPress={handleLostAtAirport}
        activeOpacity={0.85}>
        <View style={styles.sosLeft}>
          <Text style={styles.sosEmoji}>🆘</Text>
          <View>
            <Text style={styles.sosTitle}>Lost at Airport?</Text>
            <Text style={styles.sosSubtitle}>Tap here for help</Text>
          </View>
        </View>
        <Text style={styles.sosChevron}>›</Text>
      </TouchableOpacity>

      {/* ── CALM MODE BANNER ────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.calmBanner}
        onPress={() => { haptic.impact(); navigation.navigate('CalmMode'); }}
        activeOpacity={0.85}>
        <View style={styles.calmBannerLeft}>
          <Text style={styles.calmBannerEmoji}>😌</Text>
          <View>
            <Text style={styles.calmBannerTitle}>Calm Mode</Text>
            <Text style={styles.calmBannerDesc}>4-7-8 breathing for anxious flyers</Text>
          </View>
        </View>
        <Text style={styles.calmBannerChevron}>›</Text>
      </TouchableOpacity>

            {/* ── OTHER TRIPS ─────────────────────────────────────────────── */}
      {otherFlights.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Other Trips</Text>
            <Text style={[styles.sectionCount, { color: c.textSecondary }]}>
              {otherFlights.length} flight{otherFlights.length > 1 ? 's' : ''}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniCardsRow}>
            {otherFlights.map((flight, i) => {
              const idx = flights.indexOf(flight);
              const showNativeAdHere =
                i === 2 &&
                otherFlights.length >= 2 &&
                !isPremiumUser &&
                AdGuard.canShowAd(isPremiumUser, nextFlight);
              return (
                <React.Fragment key={idx}>
                  {showNativeAdHere && <SponsoredMiniCard visible={showNativeAdHere} />}
                  <MiniFlightCard
                    flight={flight}
                    onRemove={() => removeFlight(idx)}
                    fadeIn={miniFades[idx] ?? new Animated.Value(1)}
                  />
                </React.Fragment>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── ADD FLIGHT BUTTON (when flights exist) ────────────────────── */}
      {flights.length > 0 && (
        <TouchableOpacity
          style={[styles.addMoreBtn, { borderColor: c.primary }]}
          onPress={() => navigation.navigate('AddFlight')}>
          <Text style={[styles.addMoreText, { color: c.primary }]}>+ Add Another Flight</Text>
        </TouchableOpacity>
      )}

      {/* ── ALL TOOLS MODAL ──────────────────────────────────────────── */}
      <Modal
        visible={showAllTools}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllTools(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAllTools(false)} />
        <View style={[styles.modalSheet, { backgroundColor: c.card }]}>
          {/* Handle bar */}
          <View style={[styles.modalHandle, { backgroundColor: c.border }]} />
          <Text style={[styles.modalTitle, { color: c.text }]}>All Tools</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.allToolsGrid}>
            {allTools.map(tool => (
              <TouchableOpacity
                key={tool.label}
                style={[
                  styles.allToolCell,
                  { backgroundColor: c.background },
                  tool.locked && styles.allToolCellLocked,
                ]}
                onPress={tool.locked ? undefined : (tool.onPress ?? (() => setShowAllTools(false)))}
                activeOpacity={tool.locked ? 1 : 0.75}>
                <View style={styles.allToolIconRow}>
                  <Text style={[styles.allToolIcon, tool.locked && { opacity: 0.4 }]}>{tool.icon}</Text>
                  {tool.locked && <Text style={styles.lockBadge}>🔒</Text>}
                </View>
                <Text style={[styles.allToolLabel, { color: c.text }, tool.locked && { opacity: 0.4 }]}>{tool.label}</Text>
                <Text style={[styles.allToolDesc, { color: c.textSecondary }]}>
                  {tool.locked ? 'Coming Soon' : tool.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  subGreeting: { fontSize: 13 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  headerIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  headerIconEmoji: { fontSize: 22 },

  // Onboarding / countdown card shared
  deco1: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  deco2: {
    position: 'absolute', bottom: -40, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  // Onboarding card
  onboardCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
    marginBottom: 28,
    elevation: 6,
    shadowColor: '#1A56A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  onboardEmoji: { fontSize: 52, marginBottom: 14 },
  onboardTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10, lineHeight: 28,
  },
  onboardDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginBottom: 24,
  },
  onboardBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  onboardBtnText: { color: '#1A56A6', fontWeight: '800', fontSize: 15 },

  // Countdown hero card
  countdownCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  countdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  countdownFlightNum: { fontSize: 15, fontWeight: '800', color: '#fff' },
  departsIn: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  countdown: { fontSize: 52, fontWeight: '800', color: '#fff', lineHeight: 58, marginBottom: 18 },
  countdownRoute: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownIata: { fontSize: 28, fontWeight: '800', color: '#fff' },
  countdownTime: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  countdownPlane: { fontSize: 24, color: 'rgba(255,255,255,0.9)' },

  // Status card
  statusCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statusFlightNum: { flex: 1, fontSize: 17, fontWeight: '800' },
  removeBtn: { fontSize: 17 },
  statusAirline: { fontSize: 12, marginBottom: 14 },
  statusDivider: { height: 1, marginBottom: 14 },
  statusRoute: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  statusEndpoint: { flex: 1 },
  statusIata: { fontSize: 30, fontWeight: '800' },
  statusDepTime: { fontSize: 13, marginTop: 2 },
  statusAirportName: { fontSize: 11, marginTop: 3 },
  statusPlane: { fontSize: 22, marginHorizontal: 8, marginTop: 6 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  chipLabel: { fontSize: 12, fontWeight: '700' },

  // Share + DigiYatra action row (inside status card)
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
  },
  actionBtnIcon: { fontSize: 16 },
  actionBtnLabel: { fontSize: 13, fontWeight: '700' },

  // Weather card
  weatherCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  weatherHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  weatherTitle: { fontSize: 14, fontWeight: '700' },
  weatherTemp: { fontSize: 22, fontWeight: '800' },
  weatherDesc: { fontSize: 12, marginBottom: 10 },
  weatherChips: { flexDirection: 'row', gap: 8 },

  // Section titles
  sectionTitle: { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, marginBottom: 14 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionCount: { fontSize: 13 },

  // Quick tools row
  toolsRow: { paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
  toolPill: {
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 90,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  toolIcon: { fontSize: 26, marginBottom: 6 },
  toolLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Mini cards row
  miniCardsRow: { paddingHorizontal: 20, paddingBottom: 28 },

  // Lost at Airport SOS card
  sosCard: {
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  sosLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sosEmoji: { fontSize: 30 },
  sosTitle: { fontSize: 15, fontWeight: '800', color: '#92400E' },
  sosSubtitle: { fontSize: 12, color: '#B45309', marginTop: 2 },
  sosChevron: { fontSize: 26, color: '#D97706', fontWeight: '300' },

  // Calm Mode standalone banner
  calmBanner: {
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#2D1B69',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  calmBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  calmBannerEmoji: { fontSize: 36 },
  calmBannerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  calmBannerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  calmBannerChevron: { fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },

  // Add more button
  addMoreBtn: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  addMoreText: { fontSize: 15, fontWeight: '700' },

  // All Tools modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
  },
  allToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 8,
  },
  allToolCell: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  allToolIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  allToolIcon: { fontSize: 28 },
  lockBadge: { fontSize: 12, marginLeft: 6 },
  allToolCellLocked: { opacity: 0.7 },
  allToolLabel: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  allToolDesc: { fontSize: 11, lineHeight: 15 },
});
