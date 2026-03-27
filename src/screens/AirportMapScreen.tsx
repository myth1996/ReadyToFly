/**
 * AirportMapScreen — Indoor terminal maps
 *
 * Free:    Google Maps link to airport + basic terminal info
 * Premium: Full airport official map in WebView with terminal selector
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigation } from '@react-navigation/native';
import { haptic } from '../services/HapticService';

// Official airport map URLs — terminal diagrams from airport authority websites
const AIRPORT_MAP_URLS: Record<string, {
  name: string;
  city: string;
  terminals: string[];
  mapUrl: string;        // Premium WebView URL
  mapsQuery: string;     // Free Google Maps query
}> = {
  DEL: { name: 'IGI Airport',    city: 'Delhi',     terminals: ['T1','T2','T3'], mapUrl: 'https://www.newdelhiairport.in/terminal-maps', mapsQuery: 'Indira+Gandhi+International+Airport+Delhi' },
  BOM: { name: 'CSMI Airport',   city: 'Mumbai',    terminals: ['T1','T2'],     mapUrl: 'https://www.csia.in/passenger-guide/terminal-map', mapsQuery: 'Chhatrapati+Shivaji+Maharaj+International+Airport+Mumbai' },
  BLR: { name: 'KIA',            city: 'Bengaluru', terminals: ['T1','T2'],     mapUrl: 'https://www.bengaluruairport.com/terminal/terminal-maps.jspx', mapsQuery: 'Kempegowda+International+Airport+Bengaluru' },
  MAA: { name: 'Chennai Airport', city: 'Chennai',  terminals: ['Dom','Int'],   mapUrl: 'https://www.chennaiairport.com/terminal-map', mapsQuery: 'Chennai+International+Airport' },
  HYD: { name: 'RGIA',           city: 'Hyderabad', terminals: ['Dom','Int'],   mapUrl: 'https://www.hyderabad.aero/passenger/terminal-map.aspx', mapsQuery: 'Rajiv+Gandhi+International+Airport+Hyderabad' },
  CCU: { name: 'NSCBI Airport',  city: 'Kolkata',   terminals: ['Dom','Int'],   mapUrl: 'https://www.aai.aero/en/airports/kolkata', mapsQuery: 'Netaji+Subhash+Chandra+Bose+Airport+Kolkata' },
  COK: { name: 'Cochin Int\'l',  city: 'Kochi',     terminals: ['T3'],          mapUrl: 'https://www.cochinairport.com', mapsQuery: 'Cochin+International+Airport' },
  AMD: { name: 'SVP Airport',    city: 'Ahmedabad', terminals: ['Dom','Int'],   mapUrl: 'https://www.aai.aero/en/airports/ahmedabad', mapsQuery: 'Sardar+Vallabhbhai+Patel+International+Airport+Ahmedabad' },
  GOI: { name: 'Manohar Airport', city: 'Goa',      terminals: ['T1'],          mapUrl: 'https://www.goa-airport.com', mapsQuery: 'Goa+International+Airport' },
  PNQ: { name: 'Pune Airport',   city: 'Pune',      terminals: ['Dom','Int'],   mapUrl: 'https://www.aai.aero/en/airports/pune', mapsQuery: 'Pune+International+Airport' },
  JAI: { name: 'Jaipur Airport', city: 'Jaipur',    terminals: ['T1'],          mapUrl: 'https://www.aai.aero/en/airports/jaipur', mapsQuery: 'Jaipur+International+Airport' },
  SIN: { name: 'Changi Airport', city: 'Singapore', terminals: ['T1','T2','T3','T4'], mapUrl: 'https://www.changiairport.com/en/maps.html', mapsQuery: 'Singapore+Changi+Airport' },
  DXB: { name: 'Dubai Int\'l',   city: 'Dubai',     terminals: ['T1','T2','T3'], mapUrl: 'https://www.dubaiairports.ae/at-the-airport/terminal-maps', mapsQuery: 'Dubai+International+Airport' },
  LHR: { name: 'Heathrow',       city: 'London',    terminals: ['T2','T3','T4','T5'], mapUrl: 'https://www.heathrow.com/at-the-airport/terminal-maps', mapsQuery: 'London+Heathrow+Airport' },
};

interface Props {
  route?: { params?: { airportIata?: string } };
}

export function AirportMapScreen({ route }: Props) {
  const { isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();
  const navigation = useNavigation<any>();
  const airportIata = route?.params?.airportIata ?? 'DEL';
  const [selectedTerminal, setSelectedTerminal] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const airport = AIRPORT_MAP_URLS[airportIata] ?? AIRPORT_MAP_URLS.DEL;

  const openGoogleMaps = () => {
    const url = `https://maps.google.com?q=${airport.mapsQuery}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: c.primary }]}>
        <Text style={styles.headerIata}>{airportIata}</Text>
        <Text style={styles.headerName}>{airport.name}</Text>
        <Text style={styles.headerCity}>{airport.city}</Text>
      </View>

      {/* Terminal selector */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SELECT TERMINAL</Text>
      <View style={styles.terminalRow}>
        {airport.terminals.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.terminalBtn,
              { borderColor: c.border, backgroundColor: c.card },
              selectedTerminal === i && { borderColor: c.primary, backgroundColor: c.primary + '18' },
            ]}
            onPress={() => { haptic.selection(); setSelectedTerminal(i); }}>
            <Text style={[styles.terminalLabel, { color: selectedTerminal === i ? c.primary : c.text }]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map area */}
      {isPremiumUser ? (
        <>
          <View style={[styles.mapCard, { borderColor: c.border }]}>
            {showMap ? (
              <WebView
                source={{ uri: airport.mapUrl }}
                style={styles.webview}
                startInLoadingState
              />
            ) : (
              <TouchableOpacity
                style={[styles.loadMapBtn, { backgroundColor: c.primary }]}
                onPress={() => setShowMap(true)}>
                <Text style={styles.loadMapText}>🗺️ Load Official Terminal Map</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.mapNote, { color: c.textSecondary }]}>
            Map loads from {airport.name}'s official website
          </Text>
        </>
      ) : (
        /* Free users — teaser + lock */
        <View style={[styles.lockCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.lockEmoji}>🗺️</Text>
          <Text style={[styles.lockTitle, { color: c.text }]}>Indoor Terminal Maps</Text>
          <Text style={[styles.lockSub, { color: c.textSecondary }]}>
            See the full interactive terminal map — gates, lounges, shops, and security lanes — directly from the airport authority.
          </Text>
          <TouchableOpacity
            style={[styles.premiumBtn, { backgroundColor: '#F59E0B' }]}
            onPress={() => { haptic.impact(); navigation.navigate('Premium'); }}>
            <Text style={styles.premiumBtnText}>👑 Unlock with Premium</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Always available: Google Maps + facilities */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: 16 }]}>QUICK LINKS</Text>

      {[
        { emoji: '🗺️', label: 'View on Google Maps', onPress: openGoogleMaps },
        { emoji: '🚕', label: 'Pre-book cab from airport', onPress: () => navigation.navigate('CabCompare', { direction: 'from_airport', airportIata }) },
      ].map(item => (
        <TouchableOpacity
          key={item.label}
          style={[styles.linkRow, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => { haptic.impact(); item.onPress(); }}>
          <Text style={styles.linkEmoji}>{item.emoji}</Text>
          <Text style={[styles.linkLabel, { color: c.text }]}>{item.label}</Text>
          <Text style={[styles.linkChevron, { color: c.textSecondary }]}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Key facilities info */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: 16 }]}>FACILITIES</Text>
      <View style={[styles.facilitiesGrid, { backgroundColor: c.card, borderColor: c.border }]}>
        {[
          { emoji: '🛂', label: 'Immigration', detail: 'Follow signs after deplaning' },
          { emoji: '🧳', label: 'Baggage Claim', detail: 'Check arrivals board for belt' },
          { emoji: '🍽️', label: 'Food Courts', detail: 'Post-security, near gates' },
          { emoji: '🛁', label: 'Lounges', detail: 'Landside & airside — check premium card' },
          { emoji: '🔌', label: 'Charging', detail: 'Seating areas near gates' },
          { emoji: '💊', label: 'Medical', detail: 'First aid near security checkpoint' },
        ].map(f => (
          <View key={f.label} style={[styles.facilityItem, { borderBottomColor: c.border }]}>
            <Text style={styles.facilityEmoji}>{f.emoji}</Text>
            <View>
              <Text style={[styles.facilityLabel, { color: c.text }]}>{f.label}</Text>
              <Text style={[styles.facilityDetail, { color: c.textSecondary }]}>{f.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },

  headerCard: { borderRadius: 14, padding: 20, marginBottom: 20, alignItems: 'center' },
  headerIata: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 2 },
  headerName: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700', marginTop: 4 },
  headerCity: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  terminalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  terminalBtn:   { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  terminalLabel: { fontSize: 14, fontWeight: '700' },

  mapCard:    { borderRadius: 14, borderWidth: 1, overflow: 'hidden', height: 380, marginBottom: 8 },
  webview:    { flex: 1 },
  loadMapBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 380, borderRadius: 14 },
  loadMapText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  mapNote:    { fontSize: 11, textAlign: 'center', marginBottom: 16 },

  lockCard:    { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16 },
  lockEmoji:   { fontSize: 48, marginBottom: 12 },
  lockTitle:   { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  lockSub:     { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  premiumBtn:  { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  premiumBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  linkRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  linkEmoji:  { fontSize: 20, marginRight: 12 },
  linkLabel:  { flex: 1, fontSize: 14, fontWeight: '600' },
  linkChevron:{ fontSize: 20 },

  facilitiesGrid: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  facilityItem:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  facilityEmoji:  { fontSize: 20, marginRight: 12, width: 28 },
  facilityLabel:  { fontSize: 14, fontWeight: '600' },
  facilityDetail: { fontSize: 12, marginTop: 2 },
});
