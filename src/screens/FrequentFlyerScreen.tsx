import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, LayoutAnimation, Platform, UIManager,
  Linking, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { FF_PROGRAMMES, FFProgramme } from '../data/frequentFlyer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = 'flyeasy_ff_cards';

type FFCard = {
  programmeKey: string;   // airline name
  membershipId: string;
  tier: string;
  points: string;
};

// ─── Tier badge colours ────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  Blue: '#3B82F6', Silver: '#94A3B8', Gold: '#F59E0B', Platinum: '#7C3AED',
  Red: '#EF4444', Burgundy: '#7F1D1D', Member: '#6B7280',
  'Elite Silver': '#94A3B8', 'Elite Gold': '#F59E0B', Maharaja: '#C69214',
};

function tierColor(tier: string) {
  return TIER_COLORS[tier] ?? '#6B7280';
}

// ─── Single programme card ────────────────────────────────────────────────────
function ProgrammeRow({
  prog,
  card,
  expanded,
  onToggle,
  onChange,
  onSave,
}: {
  prog: FFProgramme;
  card?: FFCard;
  expanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof FFCard, value: string) => void;
  onSave: () => void;
}) {
  const { themeColors: c } = useSettings();
  const hasMembership = !!card?.membershipId;

  return (
    <View style={styles.programmeWrap}>
      <TouchableOpacity
        style={[
          styles.programmeHeader,
          { backgroundColor: c.card },
          expanded && { borderColor: prog.color, borderWidth: 1.5 },
        ]}
        onPress={onToggle}
        activeOpacity={0.75}>
        {/* Left: airline colour dot + name */}
        <View style={[styles.dot, { backgroundColor: prog.color }]}>
          <Text style={styles.dotEmoji}>{prog.emoji}</Text>
        </View>
        <View style={styles.programmeInfo}>
          <Text style={[styles.airlineName, { color: c.text }]}>{prog.airline}</Text>
          <Text style={[styles.programName, { color: c.textSecondary }]}>{prog.programName}</Text>
        </View>
        {/* Right: tier badge or "Add" */}
        {hasMembership ? (
          <View style={[styles.tierBadge, { backgroundColor: tierColor(card!.tier) + '22', borderColor: tierColor(card!.tier) }]}>
            <Text style={[styles.tierText, { color: tierColor(card!.tier) }]}>{card!.tier}</Text>
          </View>
        ) : (
          <Text style={[styles.addChip, { color: prog.color }]}>+ Add</Text>
        )}
        <Text style={[styles.chevron, { color: c.textSecondary }]}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandBody, { backgroundColor: c.card, borderColor: prog.color }]}>
          {/* Membership number */}
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Membership Number</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: c.border, color: c.text, backgroundColor: c.background }]}
            placeholder="e.g. 6E123456789"
            placeholderTextColor={c.textSecondary}
            value={card?.membershipId ?? ''}
            onChangeText={v => onChange('membershipId', v)}
            autoCapitalize="characters"
          />

          {/* Current tier */}
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Current Tier</Text>
          <View style={styles.tierPicker}>
            {prog.tiers.map(t => (
              <TouchableOpacity
                key={t.name}
                style={[
                  styles.tierOption,
                  { borderColor: c.border, backgroundColor: c.background },
                  card?.tier === t.name && { borderColor: tierColor(t.name), backgroundColor: tierColor(t.name) + '1A' },
                ]}
                onPress={() => onChange('tier', t.name)}>
                <Text style={[styles.tierOptionText, { color: c.text }, card?.tier === t.name && { color: tierColor(t.name), fontWeight: '700' }]}>
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Points balance */}
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Points / Miles Balance</Text>
          <TextInput
            style={[styles.fieldInput, { borderColor: c.border, color: c.text, backgroundColor: c.background }]}
            placeholder="e.g. 12500"
            placeholderTextColor={c.textSecondary}
            value={card?.points ?? ''}
            onChangeText={v => onChange('points', v)}
            keyboardType="numeric"
          />

          {/* Tier perks */}
          {card?.tier && (
            <View style={[styles.perksBox, { backgroundColor: prog.color + '0D', borderColor: prog.color + '44' }]}>
              <Text style={[styles.perksTitle, { color: prog.color }]}>
                {card.tier} Benefits
              </Text>
              {(prog.tiers.find(t => t.name === card.tier)?.perks ?? []).map(perk => (
                <Text key={perk} style={[styles.perkItem, { color: c.text }]}>• {perk}</Text>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: prog.color }]}
              onPress={onSave}>
              <Text style={styles.saveBtnText}>Save Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.enrollBtn, { borderColor: prog.color }]}
              onPress={() => Linking.openURL(prog.enrollUrl).catch(() =>
                Alert.alert('Cannot open', prog.enrollUrl),
              )}>
              <Text style={[styles.enrollBtnText, { color: prog.color }]}>
                {card?.membershipId ? 'Manage Online ↗' : 'Enrol Online ↗'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function FrequentFlyerScreen() {
  const { themeColors: c } = useSettings();
  const [cards, setCards] = useState<Record<string, FFCard>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  // draft changes before save
  const [drafts, setDrafts] = useState<Record<string, Partial<FFCard>>>({});

  // Load persisted cards
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) { setCards(JSON.parse(raw) as Record<string, FFCard>); }
      })
      .catch(() => { /* ignore */ });
  }, []);

  const persist = (updated: Record<string, FFCard>) => {
    setCards(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => { /* ignore */ });
  };

  const handleToggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => (prev === key ? null : key));
  };

  const handleChange = (progKey: string, field: keyof FFCard, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [progKey]: { ...(prev[progKey] ?? {}), [field]: value },
    }));
  };

  const handleSave = (progKey: string) => {
    const draft = drafts[progKey] ?? {};
    const existing = cards[progKey] ?? { programmeKey: progKey, membershipId: '', tier: '', points: '' };
    const updated = { ...existing, ...draft } as FFCard;
    persist({ ...cards, [progKey]: updated });
    setDrafts(prev => { const n = { ...prev }; delete n[progKey]; return n; });
    Alert.alert('Saved ✅', `${progKey} card updated`);
  };

  const totalSaved = Object.keys(cards).filter(k => cards[k].membershipId).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Text style={[styles.heading, { color: c.text }]}>Frequent Flyer</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>
        Track your membership IDs, tiers & points in one place
      </Text>

      {totalSaved > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: c.primary + '14', borderColor: c.primary }]}>
          <Text style={[styles.summaryText, { color: c.primary }]}>
            ✈ {totalSaved} programme{totalSaved > 1 ? 's' : ''} saved
          </Text>
        </View>
      )}

      {/* Programme list */}
      {FF_PROGRAMMES.map(prog => {
        const key = prog.airline;
        const mergedCard: FFCard | undefined = cards[key]
          ? { ...cards[key], ...(drafts[key] ?? {}) } as FFCard
          : drafts[key]
          ? { programmeKey: key, membershipId: '', tier: '', points: '', ...drafts[key] } as FFCard
          : undefined;

        return (
          <ProgrammeRow
            key={key}
            prog={prog}
            card={mergedCard}
            expanded={expanded === key}
            onToggle={() => handleToggle(key)}
            onChange={(field, value) => handleChange(key, field, value)}
            onSave={() => handleSave(key)}
          />
        );
      })}

      <Text style={[styles.footer, { color: c.textSecondary }]}>
        Data is stored on-device only. FlyEasy does not share your membership details.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 16 },
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  summaryText: { fontSize: 14, fontWeight: '700' },

  programmeWrap: { marginBottom: 10 },
  programmeHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
    borderWidth: 1, borderColor: 'transparent',
  },
  dot: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dotEmoji: { fontSize: 20 },
  programmeInfo: { flex: 1 },
  airlineName: { fontSize: 15, fontWeight: '800' },
  programName: { fontSize: 12, marginTop: 2 },
  tierBadge: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8 },
  tierText: { fontSize: 11, fontWeight: '700' },
  addChip: { fontSize: 13, fontWeight: '700', marginRight: 8 },
  chevron: { fontSize: 12 },

  expandBody: {
    borderWidth: 1.5, borderTopWidth: 0, borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14, padding: 16, marginTop: -4,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fieldInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },

  tierPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tierOption: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  tierOptionText: { fontSize: 13 },

  perksBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  perksTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  perkItem: { fontSize: 13, lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  enrollBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  enrollBtnText: { fontWeight: '700', fontSize: 14 },

  footer: { fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
