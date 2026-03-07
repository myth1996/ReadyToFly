import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';

const AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj', city: 'Mumbai' },
  { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru' },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai' },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata' },
  { code: 'COK', name: 'Cochin International', city: 'Kochi' },
  { code: 'PNQ', name: 'Pune International', city: 'Pune' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad' },
  { code: 'GOI', name: 'Goa International (Manohar)', city: 'Goa' },
];

export function AirportGuideScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { isPremiumUser } = useAuth();

  useEffect(() => {
    adService.onScreenView(isPremiumUser);
  }, [isPremiumUser]);

  const handleAirportPress = (code: string) => {
    if (selected === code) {
      setSelected(null);
      return;
    }
    adService.showRewardedAd(
      isPremiumUser,
      () => setSelected(code),
      () => {
        Alert.alert(
          'Ad not ready',
          'The ad is still loading. Try again in a moment, or upgrade to Premium to skip ads.',
        );
      },
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Airport Guide</Text>
      <Text style={styles.subheading}>Top 10 Indian Airports</Text>

      {AIRPORTS.map(airport => (
        <TouchableOpacity
          key={airport.code}
          style={[styles.row, selected === airport.code && styles.rowSelected]}
          onPress={() =>
            () => handleAirportPress(airport.code)
          }
        >
          <View style={styles.codeBox}>
            <Text style={styles.code}>{airport.code}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.city}>{airport.city}</Text>
            <Text style={styles.airportName}>{airport.name}</Text>
          </View>
          <Text style={styles.arrow}>
            {selected === airport.code ? '▲' : '▶'}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.comingSoon}>
        ✨ Terminal maps, lounges, food & ATM info — coming soon!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  rowSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  codeBox: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 52,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  code: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  info: {
    flex: 1,
  },
  city: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  airportName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 8,
  },
  comingSoon: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
