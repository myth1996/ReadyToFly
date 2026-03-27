import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, LayoutAnimation,
  Platform, UIManager, Dimensions,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightsContext';
import { AdGuard } from '../services/AdGuard';
import { adService } from '../services/AdService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { baggageRules, BaggageRule } from '../data/baggageRules';

const SCREEN_W = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function AirlineCard({ rule, expanded, onToggle, c }: {
  rule: BaggageRule;
  expanded: boolean;
  onToggle: () => void;
  c: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card }]}
      onPress={onToggle}
      activeOpacity={0.75}>

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.codeBadge, { backgroundColor: rule.color + '18', borderColor: rule.color + '40' }]}>
          <Text style={[styles.codeText, { color: rule.color }]}>{rule.code}</Text>
        </View>
        <View style={styles.airlineInfo}>
          <Text style={[styles.airlineName, { color: c.text }]}>{rule.airline}</Text>
          <Text style={[styles.cabinSummary, { color: c.textSecondary }]}>
            Cabin: {rule.cabin.weight}  ·  Check-in: {rule.checkin.economy.split('/')[0].trim()}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: c.textSecondary }]}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={[styles.detail, { borderTopColor: c.border }]}>

          {/* Cabin bag */}
          <Text style={[styles.sectionHead, { color: c.primary }]}>🎒 Cabin Bag</Text>
          <View style={[styles.ruleTable, { backgroundColor: c.background }]}>
            <InfoRow label="Weight" value={rule.cabin.weight} c={c} />
            <InfoRow label="Dimensions" value={rule.cabin.dimensions} c={c} />
            <InfoRow label="Pieces" value={rule.cabin.pieces} c={c} />
          </View>
          <Text style={[styles.noteText, { color: c.textSecondary }]}>💡 {rule.cabin.notes}</Text>

          {/* Check-in baggage */}
          <Text style={[styles.sectionHead, { color: c.primary }]}>🧳 Check-in Baggage</Text>
          <View style={[styles.ruleTable, { backgroundColor: c.background }]}>
            <InfoRow label="Economy" value={rule.checkin.economy} c={c} />
            {rule.checkin.business !== 'N/A' && (
              <InfoRow label="Business" value={rule.checkin.business} c={c} />
            )}
          </View>
          <Text style={[styles.noteText, { color: c.textSecondary }]}>💡 {rule.checkin.notes}</Text>

          {/* Excess rate */}
          <Text style={[styles.sectionHead, { color: c.primary }]}>💰 Excess Baggage</Text>
          <Text style={[styles.bodyText, { color: c.text }]}>{rule.excessRate}</Text>

          {/* Prohibited */}
          <Text style={[styles.sectionHead, { color: '#EF4444' }]}>🚫 Prohibited in Hold</Text>
          {rule.prohibited.map(item => (
            <Text key={item} style={[styles.bulletItem, { color: c.text }]}>• {item}</Text>
          ))}

          {/* Special items */}
          <Text style={[styles.sectionHead, { color: c.primary }]}>ℹ️ Special Items</Text>
          <Text style={[styles.bodyText, { color: c.text }]}>{rule.special}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function InfoRow({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

export function BaggageRulesScreen() {
  const { themeColors: c } = useSettings();
  const { isPremiumUser } = useAuth();
  const { nextFlight } = useFlights();
  const [expandedCode, setExpandedCode] = useState<string | null>('6E');

  const showBanner = !isPremiumUser && AdGuard.canShowAd(isPremiumUser, nextFlight);

  const handleToggle = (code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCode(prev => (prev === code ? null : code));
  };

  return (
    <View style={[styles.screenWrap, { backgroundColor: c.background }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, showBanner && { paddingBottom: 70 }]}>

      <Text style={[styles.heading, { color: c.text }]}>Baggage Rules</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>
        Domestic airline allowances — tap to expand
      </Text>

      {/* Quick tip */}
      <View style={[styles.tipCard, { backgroundColor: c.primary + '14', borderColor: c.primary }]}>
        <Text style={[styles.tipText, { color: c.text }]}>
          💡 <Text style={{ fontWeight: '700' }}>Pro tip:</Text> Always pre-book excess baggage online
          — airport rates are typically 2× more expensive.
        </Text>
      </View>

      {baggageRules.map((rule, index) => (
        <React.Fragment key={rule.code}>
          <AirlineCard
            rule={rule}
            expanded={expandedCode === rule.code}
            onToggle={() => handleToggle(rule.code)}
            c={c}
          />
          {index % 3 === 2 && !isPremiumUser && (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
            </View>
          )}
        </React.Fragment>
      ))}

      {/* Universal rules */}
      <View style={[styles.universalCard, { backgroundColor: c.card }]}>
        <Text style={[styles.universalTitle, { color: c.text }]}>📋 Universal Rules (All Airlines)</Text>
        {[
          '🔋 Power banks MUST go in cabin baggage only',
          '💧 Liquids >100 ml not allowed in cabin',
          '✂️ Sharp objects (scissors, razors) only in check-in baggage',
          '🔫 Firearms must be declared at check-in counter',
          '🧪 Flammable, radioactive, and corrosive materials are prohibited',
          '📱 Spare lithium batteries must be in cabin baggage',
        ].map(item => (
          <Text key={item} style={[styles.bulletItem, { color: c.text }]}>{item}</Text>
        ))}
      </View>

      <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
        Rules subject to change. Always verify current policy on the airline's website before travel.
      </Text>
    </ScrollView>

    {/* Sticky adaptive banner — always visible unless premium or near departure */}
    {showBanner && (
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={adService.getBannerUnitId()}
          size={BannerAdSize.ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_W,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 16 },

  tipCard: {
    borderRadius: 12, borderWidth: 1.5,
    padding: 14, marginBottom: 16,
  },
  tipText: { fontSize: 13, lineHeight: 20 },

  card: {
    borderRadius: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  codeBadge: {
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 6,
    minWidth: 48, alignItems: 'center',
  },
  codeText: { fontSize: 15, fontWeight: '800' },
  airlineInfo: { flex: 1 },
  airlineName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  cabinSummary: { fontSize: 12 },
  chevron: { fontSize: 14, fontWeight: '700' },

  detail: {
    padding: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHead: { fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  ruleTable: { borderRadius: 10, padding: 10, marginBottom: 6 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: { fontSize: 13, flex: 0.4 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 0.6, textAlign: 'right' },
  noteText: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  bodyText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  bulletItem: { fontSize: 13, lineHeight: 22, marginBottom: 2 },

  universalCard: {
    borderRadius: 16, padding: 18,
    marginTop: 6, marginBottom: 16,
    elevation: 1,
  },
  universalTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
