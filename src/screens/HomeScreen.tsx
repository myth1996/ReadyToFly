import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { HomeStackParamList } from '../navigation/HomeStack';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'TripDashboard'>;

export function HomeScreen() {
  const { isPremiumUser } = useAuth();
  const { t, themeColors: c } = useSettings();
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    adService.onScreenView(isPremiumUser);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    {
      icon: '🕐',
      title: t.leaveByTitle,
      desc: t.leaveByDesc,
      onPress: () => navigation.navigate('LeaveBy'),
    },
    {
      icon: '📋',
      title: t.docCheckTitle,
      desc: t.docCheckDesc,
      onPress: undefined,
    },
    {
      icon: '🔔',
      title: t.flightAlertsTitle,
      desc: t.flightAlertsDesc,
      onPress: undefined,
    },
    {
      icon: '😌',
      title: t.calmModeTitle,
      desc: t.calmModeDesc,
      onPress: undefined,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={styles.content}>

      <View style={[styles.hero, { backgroundColor: c.primary }]}>
        <Text style={styles.heroTitle}>✈️ FlyEasy</Text>
        <Text style={styles.heroTagline}>{t.appTagline}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>
        {t.quickActions}
      </Text>

      {!isPremiumUser && (
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={adService.getBannerUnitId()}
            size={BannerAdSize.BANNER}
          />
        </View>
      )}

      <View style={styles.grid}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.title}
            style={[styles.card, { backgroundColor: c.card }]}
            onPress={card.onPress}
            activeOpacity={card.onPress ? 0.7 : 1}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <Text style={[styles.cardTitle, { color: c.text }]}>{card.title}</Text>
            <Text style={[styles.cardDesc, { color: c.textSecondary }]}>
              {card.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  hero: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    width: '47%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
  },
});
