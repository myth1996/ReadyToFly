/**
 * ProfileScreen — My Account
 *
 * Shows user identity, account stats, quick-links to all personal
 * features, premium status and upgrade CTA, and sign-out.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFlights, effectiveDepTime } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';

// ─── Section row ──────────────────────────────────────────────────────────────

function MenuRow({
  icon, label, value, onPress, accent,
}: {
  icon: string; label: string; value?: string;
  onPress: () => void; accent?: boolean;
}) {
  const { themeColors: c } = useSettings();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: c.card, borderColor: c.border }, accent && { backgroundColor: c.primary + '12', borderColor: c.primary + '40' }]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: accent ? c.primary : c.text }, accent && { fontWeight: '800' }]}>
        {label}
      </Text>
      {value ? <Text style={[styles.rowValue, { color: c.textSecondary }]}>{value}</Text> : null}
      <Text style={[styles.rowChevron, { color: accent ? c.primary : c.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ num, label, color }: { num: number | string; label: string; color: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.statNum, { color }]}>{num}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { user, signOut, isPremiumUser, isInTrial } = useAuth();
  const { flights } = useFlights();
  const { themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  // Account stats
  const now = Date.now();
  const pastFlights = useMemo(
    () => flights.filter(f => new Date(effectiveDepTime(f.dep)).getTime() < now - 2 * 3600_000),
    [flights], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const upcomingCount = flights.length - pastFlights.length;
  const uniqueAirlines = new Set(flights.map(f => f.airline)).size;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { haptic.warning(); signOut(); } },
    ]);
  };

  const go = (screen: string) => {
    haptic.selection();
    navigation.navigate(screen);
  };

  // Display identifier: phone number preferred, fall back to UID truncated
  const displayId = user?.phoneNumber
    ?? (user?.uid ? `UID: ${user.uid.slice(0, 12)}…` : null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      {/* ── Avatar + identity ────────────────────────────────────────────── */}
      <View style={[styles.profileCard, { backgroundColor: c.primary }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.welcomeText}>
          {user ? 'My Account' : 'Welcome to ReadyToFly!'}
        </Text>
        {displayId ? (
          <Text style={styles.displayId}>{displayId}</Text>
        ) : null}

        {/* Premium badge */}
        {isPremiumUser && (
          <View style={styles.premBadge}>
            <Text style={styles.premBadgeText}>
              {isInTrial ? '⏳ Trial Active' : '👑 Premium Member'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {flights.length > 0 && (
        <View style={styles.statsRow}>
          <StatBox num={pastFlights.length}  label="Flown"    color={c.primary} />
          <StatBox num={upcomingCount}        label="Upcoming" color="#10B981" />
          <StatBox num={uniqueAirlines}       label="Airlines" color="#F59E0B" />
        </View>
      )}

      {/* ── My Flights & History ─────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>FLIGHTS</Text>
      <MenuRow icon="➕" label="Add New Flight"       onPress={() => go('AddFlight')} />
      <MenuRow icon="📅" label="Upcoming Flights"     value={upcomingCount > 0 ? `${upcomingCount}` : undefined} onPress={() => go('TripDashboard')} />
      <MenuRow icon="🕰️" label="Flight History"        value={pastFlights.length > 0 ? `${pastFlights.length} flights` : undefined} onPress={() => go('FlightHistory')} />
      <MenuRow icon="✈️✈️" label="Multi-Leg Trips"    onPress={() => go('MultiLeg')} />

      {/* ── Tools ────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>TOOLS</Text>
      <MenuRow icon="📩" label="Import from SMS"       onPress={() => go('SmsImport')} />
      <MenuRow icon="🗂️" label="Trip Vault"            onPress={() => go('TripVault')} />
      <MenuRow icon="🏅" label="Frequent Flyer Miles"  onPress={() => go('FrequentFlyer')} />
      <MenuRow icon="👥" label="Co-Traveller"          onPress={() => go('CoTraveller')} />

      {/* ── Premium ──────────────────────────────────────────────────────── */}
      {!isPremiumUser && (
        <>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>PREMIUM</Text>
          <TouchableOpacity
            style={[styles.premiumCard, { backgroundColor: c.primary }]}
            onPress={() => { haptic.impact(); go('Premium'); }}
            activeOpacity={0.85}>
            <View style={styles.premiumCardLeft}>
              <Text style={styles.premiumCardTitle}>✨ Go Ad-Free with Premium</Text>
              <Text style={styles.premiumCardSub}>From ₹99/month · 7-day free trial</Text>
            </View>
            <Text style={styles.premiumCardArrow}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>ACCOUNT</Text>
      <MenuRow icon="🔒" label="Privacy Policy"   onPress={() => go('PrivacyPolicy')} />
      <MenuRow icon="📄" label="Terms of Service" onPress={() => go('TermsOfService')} />

      {user ? (
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: c.error ?? '#EF4444' }]}
          onPress={handleSignOut}>
          <Text style={[styles.signOutText, { color: c.error ?? '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.signInBtn, { backgroundColor: c.primary }]}
          onPress={() => navigation.navigate('Login' as any)}>
          <Text style={styles.signInText}>Sign In with Phone</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.version, { color: c.textSecondary }]}>ReadyToFly v1.4.1</Text>
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
  content:   { padding: 16, paddingBottom: 48 },

  profileCard:  { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarEmoji:  { fontSize: 34 },
  welcomeText:  { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  displayId:    { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  premBadge:    { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  premBadgeText:{ color: '#fff', fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox:  { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', paddingVertical: 12 },
  statNum:  { fontSize: 24, fontWeight: '900' },
  statLabel:{ fontSize: 11, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 2 },

  row:        { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  rowIcon:    { fontSize: 20, width: 34 },
  rowLabel:   { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue:   { fontSize: 13, marginRight: 6 },
  rowChevron: { fontSize: 20, fontWeight: '300' },

  premiumCard:      { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  premiumCardLeft:  { flex: 1 },
  premiumCardTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  premiumCardSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  premiumCardArrow: { color: '#fff', fontSize: 24, fontWeight: '300' },

  signOutBtn:  { borderRadius: 12, borderWidth: 1.5, padding: 15, alignItems: 'center', marginTop: 12 },
  signOutText: { fontSize: 15, fontWeight: '700' },
  signInBtn:   { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 12 },
  signInText:  { color: '#fff', fontSize: 15, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});
