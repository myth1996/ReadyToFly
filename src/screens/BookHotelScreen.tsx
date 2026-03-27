import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useFlights } from '../context/FlightsContext';
import { haptic } from '../services/HapticService';

function isoToDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

function displayToYYYYMMDD(display: string): string {
  try {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };
    const parts = display.split(' ');
    if (parts.length === 3) {
      return `${parts[2]}-${months[parts[1]] ?? '01'}-${parts[0].padStart(2, '0')}`;
    }
    const d = new Date(display);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function addDayToDisplay(display: string): string {
  try {
    const parts = display.split(' ');
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const d = new Date(
      Number(parts[2]),
      months[parts[1]] ?? 0,
      Number(parts[0]) + 1,
    );
    return isoToDisplay(d.toISOString());
  } catch {
    return display;
  }
}

// Extract city name from airport name like "Chhatrapati Shivaji Maharaj International Airport"
function airportToCity(airportName: string, iata: string): string {
  const cityMap: Record<string, string> = {
    DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bangalore', MAA: 'Chennai',
    CCU: 'Kolkata', HYD: 'Hyderabad', COK: 'Kochi', AMD: 'Ahmedabad',
    PNQ: 'Pune', GOI: 'Goa', JAI: 'Jaipur', LKO: 'Lucknow',
    IXC: 'Chandigarh', BBI: 'Bhubaneswar', IXR: 'Ranchi', PAT: 'Patna',
    GAU: 'Guwahati', TRV: 'Thiruvananthapuram', IXE: 'Mangalore', VTZ: 'Visakhapatnam',
  };
  return cityMap[iata] ?? airportName.split(' ')[0];
}

const PARTNERS = [
  {
    name: 'Booking.com',
    emoji: '🔵',
    tagline: 'Widest selection, free cancellation',
    color: '#003580',
    buildUrl: (city: string, checkIn: string, checkOut: string, guests: number) => {
      const ci = displayToYYYYMMDD(checkIn);
      const co = displayToYYYYMMDD(checkOut);
      return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${ci}&checkout=${co}&group_adults=${guests}`;
    },
  },
  {
    name: 'MakeMyTrip',
    emoji: '🔴',
    tagline: 'Best Indian hotel deals',
    color: '#D0021B',
    buildUrl: (city: string) =>
      `https://www.makemytrip.com/hotels/${encodeURIComponent(city.toLowerCase())}-hotels/`,
  },
  {
    name: 'Goibibo',
    emoji: '🟤',
    tagline: 'Last-minute deals & wallet cash',
    color: '#E87722',
    buildUrl: (city: string, checkIn: string, checkOut: string, guests: number) => {
      const ci = displayToYYYYMMDD(checkIn).replace(/-/g, '');
      const co = displayToYYYYMMDD(checkOut).replace(/-/g, '');
      return `https://www.goibibo.com/hotels/hotels-in-${encodeURIComponent(city.toLowerCase())}/?ci=${ci}&co=${co}&r=1|${guests}|0|0`;
    },
  },
  {
    name: 'OYO',
    emoji: '🟠',
    tagline: 'Budget-friendly, instant confirm',
    color: '#EF4444',
    buildUrl: (city: string, checkIn: string, checkOut: string) => {
      const ci = displayToYYYYMMDD(checkIn);
      const co = displayToYYYYMMDD(checkOut);
      return `https://www.oyorooms.com/search?location=${encodeURIComponent(city)}&checkin=${ci}&checkout=${co}`;
    },
  },
];

export function BookHotelScreen() {
  const { themeColors: c } = useSettings();
  const { nextFlight } = useFlights();

  const defaultCity = nextFlight
    ? airportToCity(nextFlight.arr.airport, nextFlight.arr.iata)
    : '';
  const defaultCheckIn = nextFlight?.arr?.scheduledTime
    ? isoToDisplay(nextFlight.arr.scheduledTime)
    : isoToDisplay(new Date().toISOString());
  const defaultCheckOut = addDayToDisplay(defaultCheckIn);

  const [city, setCity] = useState(defaultCity);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(1);

  const handleBook = (partner: typeof PARTNERS[number]) => {
    haptic.impact();
    const c2 = city.trim() || 'Mumbai';
    const url = partner.buildUrl(c2, checkIn, checkOut, guests);
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {nextFlight && (
        <View style={[styles.banner, { backgroundColor: c.primary + '15', borderColor: c.primary + '40' }]}>
          <Text style={styles.bannerEmoji}>🏨</Text>
          <Text style={[styles.bannerText, { color: c.primary }]}>
            Pre-filled for arrival at {nextFlight.arr.iata} — {nextFlight.arr.airport}
          </Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Find a Hotel</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CITY OR AREA</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
            value={city}
            onChangeText={setCity}
            placeholder="Mumbai"
            placeholderTextColor={c.textSecondary}
          />
        </View>

        <View style={styles.datesRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CHECK-IN</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              value={checkIn}
              onChangeText={setCheckIn}
              placeholder="28 Mar 2025"
              placeholderTextColor={c.textSecondary}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CHECK-OUT</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              value={checkOut}
              onChangeText={setCheckOut}
              placeholder="29 Mar 2025"
              placeholderTextColor={c.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>GUESTS</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: c.border }]}
              onPress={() => { haptic.selection(); setGuests(g => Math.max(1, g - 1)); }}>
              <Text style={[styles.stepBtnText, { color: c.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: c.text }]}>{guests} guest{guests > 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: c.border }]}
              onPress={() => { haptic.selection(); setGuests(g => Math.min(8, g + 1)); }}>
              <Text style={[styles.stepBtnText, { color: c.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>BOOK ON</Text>

      {PARTNERS.map(p => (
        <TouchableOpacity
          key={p.name}
          style={[styles.partnerBtn, { backgroundColor: p.color }]}
          onPress={() => handleBook(p)}
          activeOpacity={0.82}>
          <View style={styles.partnerLeft}>
            <Text style={styles.partnerEmoji}>{p.emoji}</Text>
            <View>
              <Text style={styles.partnerName}>{p.name}</Text>
              <Text style={styles.partnerTagline}>{p.tagline}</Text>
            </View>
          </View>
          <Text style={styles.partnerArrow}>Search →</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Prices shown by partners. ReadyToFly may earn a commission on bookings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  bannerEmoji: { fontSize: 18 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  inputGroup: {},
  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 15, fontWeight: '500',
  },
  datesRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '600' },
  stepValue: { fontSize: 15, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    marginTop: 8, marginBottom: 4,
  },
  partnerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 16, marginBottom: 8,
  },
  partnerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerEmoji: { fontSize: 24 },
  partnerName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  partnerTagline: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  partnerArrow: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
