/**
 * ServicesScreen — Super App Services Hub
 *
 * 10 service cards in a 2-column grid across 3 categories.
 * Context banner shows next flight info if available.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFlights } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { haptic } from '../services/HapticService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCard {
  id: string;
  title: string;
  emoji: string;
  subtitle: string;
  accent: string;
  isAffiliate: boolean;
  onPress: () => void;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { nextFlight } = useFlights();
  const { themeColors: c, isDarkMode } = useSettings();

  const [gateModalVisible, setGateModalVisible] = useState(false);

  const depIata = nextFlight?.dep?.iata ?? 'DEL';
  const arrIata = nextFlight?.arr?.iata ?? 'BOM';
  const airlineName = nextFlight?.airline ?? '';
  const flightIata = nextFlight?.flightIata ?? '';

  // ─── Service definitions ──────────────────────────────────────────────────

  const bookSaveCards: ServiceCard[] = [
    {
      id: 'book-flight',
      title: 'Book Flight',
      emoji: '🎫',
      subtitle: 'Best fare comparison',
      accent: '#1B6FE8',
      isAffiliate: true,
      onPress: () => {
        haptic.impact();
        navigation.navigate('BookFlight');
      },
    },
    {
      id: 'book-hotel',
      title: 'Book Hotel',
      emoji: '🏨',
      subtitle: 'Near arrival airport',
      accent: '#7C3AED',
      isAffiliate: true,
      onPress: () => {
        haptic.impact();
        navigation.navigate('BookHotel');
      },
    },
    {
      id: 'cab-to-airport',
      title: 'Cab to Airport',
      emoji: '🚕',
      subtitle: 'Ola, Uber, Savaari',
      accent: '#F59E0B',
      isAffiliate: true,
      onPress: () => {
        haptic.impact();
        navigation.navigate('Home', {
          screen: 'CabCompare',
          params: { direction: 'to_airport', airportIata: depIata },
        });
      },
    },
    {
      id: 'insurance',
      title: 'Travel Insurance',
      emoji: '🛡️',
      subtitle: 'Protect your trip',
      accent: '#10B981',
      isAffiliate: true,
      onPress: () => {
        haptic.impact();
        navigation.navigate('Insurance');
      },
    },
  ];

  const trackKnowCards: ServiceCard[] = [
    {
      id: 'gate-terminal',
      title: 'Gate & Terminal',
      emoji: '🚪',
      subtitle: 'Live gate updates',
      accent: '#0EA5E9',
      isAffiliate: false,
      onPress: () => {
        haptic.selection();
        setGateModalVisible(true);
      },
    },
    {
      id: 'baggage-tracking',
      title: 'Baggage Tracking',
      emoji: '🧳',
      subtitle: "Where's your bag?",
      accent: '#6366F1',
      isAffiliate: false,
      onPress: () => {
        haptic.impact();
        navigation.navigate('BaggageTrack');
      },
    },
    {
      id: 'wait-times',
      title: 'Airport Wait Times',
      emoji: '⏱️',
      subtitle: 'Queue estimates',
      accent: '#EC4899',
      isAffiliate: false,
      onPress: () => {
        haptic.impact();
        navigation.navigate('WaitingTime');
      },
    },
  ];

  const getHelpCards: ServiceCard[] = [
    {
      id: 'cab-from-airport',
      title: 'Cab from Airport',
      emoji: '🚕',
      subtitle: 'Book on arrival',
      accent: '#F97316',
      isAffiliate: true,
      onPress: () => {
        haptic.impact();
        navigation.navigate('Home', {
          screen: 'CabCompare',
          params: { direction: 'from_airport', airportIata: arrIata },
        });
      },
    },
    {
      id: 'dgca-complaint',
      title: 'DGCA Complaint',
      emoji: '⚖️',
      subtitle: 'File with regulator',
      accent: '#EF4444',
      isAffiliate: false,
      onPress: () => {
        haptic.impact();
        navigation.navigate('AppWebView', {
          url: 'https://airsewa.gov.in/site/complaindashboard/index',
          title: '⚖️ DGCA / AirSewa',
        });
      },
    },
    {
      id: 'airline-complaint',
      title: 'Airline Complaint',
      emoji: '📞',
      subtitle: 'Direct grievance',
      accent: '#DC2626',
      isAffiliate: false,
      onPress: () => {
        haptic.impact();
        navigation.navigate('AirlineComplaint');
      },
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0F172A' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSubtitle}>Everything for your journey</Text>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: c.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Context Banner */}
        {nextFlight && (
          <View style={[styles.contextBanner, { backgroundColor: '#1B6FE820', borderColor: '#1B6FE840' }]}>
            <Text style={styles.contextBannerEmoji}>✈️</Text>
            <View style={styles.contextBannerText}>
              <Text style={[styles.contextBannerLabel, { color: '#1B6FE8' }]}>
                Pre-filled for your trip
              </Text>
              <Text style={[styles.contextBannerFlight, { color: c.text }]}>
                {airlineName} {flightIata} · {depIata} → {arrIata}
              </Text>
            </View>
          </View>
        )}

        {/* Category: Book & Save */}
        <CategorySection
          title="✈️ Book & Save"
          cards={bookSaveCards}
          themeColors={c}
        />

        {/* Category: Track & Know */}
        <CategorySection
          title="🔍 Track & Know"
          cards={trackKnowCards}
          themeColors={c}
        />

        {/* Category: Get Help */}
        <CategorySection
          title="📣 Get Help"
          cards={getHelpCards}
          themeColors={c}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Gate & Terminal Modal */}
      <Modal
        visible={gateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Gate & Terminal Info</Text>

            {nextFlight ? (
              <>
                <View style={[styles.gateRow, { borderColor: c.border }]}>
                  <View style={styles.gateSection}>
                    <Text style={[styles.gateLabel, { color: c.textSecondary }]}>DEPARTURE</Text>
                    <Text style={[styles.gateAirport, { color: c.text }]}>{nextFlight.dep.iata}</Text>
                    <GateItem label="Terminal" value={nextFlight.dep.terminal || '—'} textColor={c.text} secondaryColor={c.textSecondary} />
                    <GateItem label="Gate" value={nextFlight.dep.gate || '—'} textColor={c.text} secondaryColor={c.textSecondary} />
                  </View>
                  <View style={[styles.gateDivider, { backgroundColor: c.border }]} />
                  <View style={styles.gateSection}>
                    <Text style={[styles.gateLabel, { color: c.textSecondary }]}>ARRIVAL</Text>
                    <Text style={[styles.gateAirport, { color: c.text }]}>{nextFlight.arr.iata}</Text>
                    <GateItem label="Terminal" value={nextFlight.arr.terminal || '—'} textColor={c.text} secondaryColor={c.textSecondary} />
                    <GateItem label="Gate" value={nextFlight.arr.gate || '—'} textColor={c.text} secondaryColor={c.textSecondary} />
                  </View>
                </View>
                <Text style={[styles.gateNote, { color: c.textSecondary }]}>
                  Gate info is confirmed closer to departure. Check airline app for live updates.
                </Text>
              </>
            ) : (
              <View style={styles.noFlightContainer}>
                <Text style={styles.noFlightEmoji}>🚪</Text>
                <Text style={[styles.noFlightText, { color: c.textSecondary }]}>
                  Add a flight to see gate and terminal information.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: '#1B6FE8' }]}
              onPress={() => {
                haptic.selection();
                setGateModalVisible(false);
              }}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  title,
  cards,
  themeColors: c,
}: {
  title: string;
  cards: ServiceCard[];
  themeColors: any;
}) {
  return (
    <View style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color: c.textSecondary }]}>{title}</Text>
      <View style={styles.cardGrid}>
        {cards.map(card => (
          <ServiceCardItem key={card.id} card={card} themeColors={c} />
        ))}
        {/* Fill odd row with placeholder */}
        {cards.length % 2 !== 0 && <View style={styles.cardPlaceholder} />}
      </View>
    </View>
  );
}

// ─── Service Card Item ────────────────────────────────────────────────────────

function ServiceCardItem({
  card,
  themeColors: c,
}: {
  card: ServiceCard;
  themeColors: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.serviceCard, { backgroundColor: c.card, shadowColor: '#000' }]}
      onPress={card.onPress}
      activeOpacity={0.75}
    >
      {card.isAffiliate && (
        <View style={[styles.earnBadge, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]}>
          <Text style={styles.earnBadgeText}>Earn</Text>
        </View>
      )}
      <View style={[styles.iconContainer, { backgroundColor: card.accent + '20' }]}>
        <Text style={styles.cardEmoji}>{card.emoji}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]}>{card.title}</Text>
      <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>{card.subtitle}</Text>
    </TouchableOpacity>
  );
}

// ─── Gate Item ────────────────────────────────────────────────────────────────

function GateItem({
  label,
  value,
  textColor,
  secondaryColor,
}: {
  label: string;
  value: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.gateItem}>
      <Text style={[styles.gateItemLabel, { color: secondaryColor }]}>{label}</Text>
      <Text style={[styles.gateItemValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP = 12;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -8,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  contextBannerEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  contextBannerText: {
    flex: 1,
  },
  contextBannerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contextBannerFlight: {
    fontSize: 15,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  serviceCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    minHeight: 130,
  },
  cardPlaceholder: {
    width: '48%',
  },
  earnBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  earnBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomPadding: {
    height: 32,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  gateRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  gateSection: {
    flex: 1,
    padding: 14,
  },
  gateDivider: {
    width: 1,
  },
  gateLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gateAirport: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  gateItem: {
    marginBottom: 6,
  },
  gateItemLabel: {
    fontSize: 11,
    marginBottom: 1,
  },
  gateItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  gateNote: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  noFlightContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noFlightEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  noFlightText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalCloseBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
