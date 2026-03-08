import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AirportInfo = {
  code: string;
  name: string;
  city: string;
  terminals: string;
  lounges: string;
  transport: string;
  wifi: string;
  helpline: string;
};

const AIRPORTS: AirportInfo[] = [
  {
    code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi',
    terminals: 'T1 (Domestic low-cost), T2 (Domestic), T3 (International & full-service domestic)',
    lounges: 'Plaza Premium (T1, T3), ITC Green Lounge (T3), Air India Maharaja (T3)',
    transport: 'Airport Express Metro (20 min to New Delhi, ₹60), Cab (₹350-600), Bus (₹50)',
    wifi: 'Free 30 min Wi-Fi (Tata Docomo)',
    helpline: '0124-337-6000',
  },
  {
    code: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai',
    terminals: 'T1 (Domestic), T2 (International & select domestic)',
    lounges: 'Pranaam (T2), GVK Lounge (T2), Adani Lounge (T1)',
    transport: 'Western Railway (Andheri, ₹10), Cab (₹400-700), Bus (BEST ₹100-150)',
    wifi: 'Free 45 min Wi-Fi',
    helpline: '022-6685-1010',
  },
  {
    code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru',
    terminals: 'T1 (Domestic & International), T2 (New — select airlines)',
    lounges: 'Above Ground Level (T1), BLR Lounge (T1), Plaza Premium (T2)',
    transport: 'BMTC Vayu Vajra Bus (₹250-350), Cab (₹600-900), Kempegowda Metro (upcoming)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '080-2201-2001',
  },
  {
    code: 'MAA', name: 'Chennai International', city: 'Chennai',
    terminals: 'T1 (Domestic), T4 (International)',
    lounges: 'TFS Lounge (T1), Travel Club (T4)',
    transport: 'MRTS Tirusulam Station (₹10), Cab (₹300-500), Bus (MTC ₹30)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '044-2256-0551',
  },
  {
    code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad',
    terminals: 'Single terminal (Domestic + International)',
    lounges: 'Plaza Premium, Above Ground Level, ITC Green Lounge',
    transport: 'Pushpak Bus (₹250), Cab (₹800-1200), Metro to Raidurg + cab',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '040-6546-6370',
  },
  {
    code: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata',
    terminals: 'Integrated terminal (Domestic gate 1-8, International gate 9-20)',
    lounges: 'TFS Lounge, Travel Club Lounge, Priority Pass accepted',
    transport: 'AC Bus (₹70-100), Cab (₹250-500), Metro (Dum Dum station, ₹10-30)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '033-2511-8787',
  },
  {
    code: 'COK', name: 'Cochin International', city: 'Kochi',
    terminals: 'T1 (International), T2 (Domestic), T3 (New International)',
    lounges: 'Cochin Lounge (T3), Priority Pass accepted',
    transport: 'AC Bus (₹90), Cab (₹600-1000), Prepaid taxi counter',
    wifi: 'Free Wi-Fi (30 min)',
    helpline: '0484-261-0115',
  },
  {
    code: 'PNQ', name: 'Pune International', city: 'Pune',
    terminals: 'New terminal (single, opened 2023)',
    lounges: 'TFS Lounge, Encalm Lounge',
    transport: 'PMPML Bus (₹30), Cab (₹200-400), Auto (₹150-250)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '020-2691-4510',
  },
  {
    code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad',
    terminals: 'T1 (Domestic), T2 (International)',
    lounges: 'Encalm Lounge (T1), Priority Pass accepted',
    transport: 'AMTS Bus (₹30), Cab (₹200-400), Metro (upcoming)',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '079-2286-9211',
  },
  {
    code: 'GOI', name: 'Goa International (Manohar)', city: 'Goa',
    terminals: 'Single terminal (Manohar International, Mopa)',
    lounges: 'Adani Lounge, Priority Pass accepted',
    transport: 'Kadamba Bus (₹200), Cab (₹1200-2000 to South Goa), Prepaid taxi',
    wifi: 'Free 30 min Wi-Fi',
    helpline: '0832-254-0806',
  },
];

export function AirportGuideScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();

  useEffect(() => {
    adService.onScreenView(isPremiumUser);
  }, [isPremiumUser]);

  const handleAirportPress = (code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selected === code) {
      setSelected(null);
      return;
    }
    setSelected(code);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: c.text }]}>Airport Guide</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>
        Top 10 Indian Airports — tap to expand
      </Text>

      {AIRPORTS.map(airport => {
        const isExpanded = selected === airport.code;
        return (
          <View key={airport.code}>
            <TouchableOpacity
              style={[styles.row, { backgroundColor: c.card }, isExpanded && { borderColor: c.primary, borderWidth: 2 }]}
              onPress={() => handleAirportPress(airport.code)}
              activeOpacity={0.75}>
              <View style={[styles.codeBox, { backgroundColor: c.primary }]}>
                <Text style={styles.code}>{airport.code}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.city, { color: c.text }]}>{airport.city}</Text>
                <Text style={[styles.airportName, { color: c.textSecondary }]}>{airport.name}</Text>
              </View>
              <Text style={[styles.arrow, { color: c.primary }]}>
                {isExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {/* Expandable content */}
            {isExpanded && (
              <View style={[styles.expandCard, { backgroundColor: c.card, borderColor: c.primary }]}>
                <InfoRow emoji="🏛️" label="Terminals" value={airport.terminals} textColor={c.text} subColor={c.textSecondary} />
                <InfoRow emoji="🛋️" label="Lounges" value={airport.lounges} textColor={c.text} subColor={c.textSecondary} />
                <InfoRow emoji="🚗" label="Transport" value={airport.transport} textColor={c.text} subColor={c.textSecondary} />
                <InfoRow emoji="📶" label="Wi-Fi" value={airport.wifi} textColor={c.text} subColor={c.textSecondary} />
                <InfoRow emoji="📞" label="Helpline" value={airport.helpline} textColor={c.text} subColor={c.textSecondary} />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function InfoRow({ emoji, label, value, textColor, subColor }: {
  emoji: string; label: string; value: string; textColor: string; subColor: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: subColor }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  codeBox: {
    borderRadius: 8,
    width: 52,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  code: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  info: { flex: 1 },
  city: { fontSize: 15, fontWeight: '700' },
  airportName: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 12, marginLeft: 8 },
  expandCard: {
    marginTop: -6,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  infoEmoji: { fontSize: 18, marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 13, lineHeight: 19 },
});
