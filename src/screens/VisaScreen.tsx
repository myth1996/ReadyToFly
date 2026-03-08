import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Linking, Alert, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { VISA_REQUIREMENTS, STATUS_LABEL, VisaStatus } from '../data/visaRequirements';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUS_COLOR: Record<VisaStatus, string> = {
  free:  '#10B981',
  voa:   '#F59E0B',
  evisa: '#3B82F6',
  req:   '#EF4444',
};

const FILTER_OPTIONS: { label: string; value: VisaStatus | 'all' }[] = [
  { label: 'All',         value: 'all'   },
  { label: 'Visa Free ✅', value: 'free'  },
  { label: 'On Arrival 🟡', value: 'voa' },
  { label: 'e-Visa 🔵',   value: 'evisa' },
  { label: 'Required 🔴', value: 'req'   },
];

export function VisaScreen() {
  const { themeColors: c } = useSettings();
  const [filter, setFilter] = useState<VisaStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VISA_REQUIREMENTS.filter(v => {
      const matchFilter = filter === 'all' || v.status === filter;
      const matchSearch = !q || v.country.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [filter, search]);

  const toggle = (country: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => (prev === country ? null : country));
  };

  const freeCount  = VISA_REQUIREMENTS.filter(v => v.status === 'free').length;
  const voaCount   = VISA_REQUIREMENTS.filter(v => v.status === 'voa').length;
  const evisaCount = VISA_REQUIREMENTS.filter(v => v.status === 'evisa').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Text style={[styles.heading, { color: c.text }]}>Visa Guide 🛂</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>
        For Indian passport holders — verify before travel
      </Text>

      {/* Summary chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: STATUS_COLOR.free + '18', borderColor: STATUS_COLOR.free }]}>
          <Text style={[styles.summaryNum, { color: STATUS_COLOR.free }]}>{freeCount}</Text>
          <Text style={[styles.summaryLabel, { color: STATUS_COLOR.free }]}>Visa Free</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: STATUS_COLOR.voa + '18', borderColor: STATUS_COLOR.voa }]}>
          <Text style={[styles.summaryNum, { color: STATUS_COLOR.voa }]}>{voaCount}</Text>
          <Text style={[styles.summaryLabel, { color: STATUS_COLOR.voa }]}>On Arrival</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: STATUS_COLOR.evisa + '18', borderColor: STATUS_COLOR.evisa }]}>
          <Text style={[styles.summaryNum, { color: STATUS_COLOR.evisa }]}>{evisaCount}</Text>
          <Text style={[styles.summaryLabel, { color: STATUS_COLOR.evisa }]}>e-Visa</Text>
        </View>
      </ScrollView>

      {/* Search */}
      <TextInput
        style={[styles.searchInput, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
        placeholder="🔍  Search country..."
        placeholderTextColor={c.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.filterChip,
              { borderColor: c.border, backgroundColor: c.card },
              filter === opt.value && {
                borderColor: opt.value === 'all' ? c.primary : STATUS_COLOR[opt.value as VisaStatus],
                backgroundColor: (opt.value === 'all' ? c.primary : STATUS_COLOR[opt.value as VisaStatus]) + '18',
              },
            ]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFilter(opt.value as VisaStatus | 'all');
            }}>
            <Text style={[
              styles.filterText, { color: c.textSecondary },
              filter === opt.value && {
                color: opt.value === 'all' ? c.primary : STATUS_COLOR[opt.value as VisaStatus],
                fontWeight: '700',
              },
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Country list */}
      {visible.map(entry => {
        const isOpen = expanded === entry.country;
        const statusCol = STATUS_COLOR[entry.status];
        return (
          <View key={entry.country} style={styles.entryWrap}>
            <TouchableOpacity
              style={[styles.entryRow, { backgroundColor: c.card }, isOpen && { borderColor: statusCol, borderWidth: 1.5 }]}
              onPress={() => toggle(entry.country)}
              activeOpacity={0.75}>
              <Text style={styles.flag}>{entry.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={[styles.countryName, { color: c.text }]}>{entry.country}</Text>
                {entry.duration && (
                  <Text style={[styles.duration, { color: c.textSecondary }]}>
                    Up to {entry.duration}
                  </Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusCol + '1A', borderColor: statusCol }]}>
                <Text style={[styles.statusText, { color: statusCol }]}>
                  {STATUS_LABEL[entry.status]}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: c.textSecondary }]}>{isOpen ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={[styles.expandBody, { backgroundColor: c.card, borderColor: statusCol }]}>
                <Text style={[styles.notes, { color: c.text }]}>{entry.notes}</Text>

                {entry.iatas.length > 0 && (
                  <View style={styles.iataRow}>
                    <Text style={[styles.iataTitle, { color: c.textSecondary }]}>Airports:</Text>
                    {entry.iatas.map(iata => (
                      <View key={iata} style={[styles.iataChip, { backgroundColor: c.primary + '18' }]}>
                        <Text style={[styles.iataCode, { color: c.primary }]}>{iata}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {entry.applyUrl && (
                  <TouchableOpacity
                    style={[styles.applyBtn, { backgroundColor: statusCol }]}
                    onPress={() => Linking.openURL(entry.applyUrl!).catch(() =>
                      Alert.alert('Cannot open link', entry.applyUrl!),
                    )}>
                    <Text style={styles.applyBtnText}>Apply / Official Portal ↗</Text>
                  </TouchableOpacity>
                )}

                <Text style={[styles.disclaimer, { color: c.textSecondary }]}>
                  ⚠ Visa rules change frequently. Always verify with the official embassy or IATA Travel Centre before travel.
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {visible.length === 0 && (
        <Text style={[styles.empty, { color: c.textSecondary }]}>No results for "{search}"</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 16 },

  summaryRow: { gap: 10, marginBottom: 16 },
  summaryChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', minWidth: 80 },
  summaryNum: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  searchInput: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 12,
  },
  filterRow: { gap: 8, marginBottom: 16 },
  filterChip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filterText: { fontSize: 13 },

  entryWrap: { marginBottom: 8 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, borderWidth: 1, borderColor: 'transparent',
  },
  flag: { fontSize: 28, marginRight: 12 },
  countryInfo: { flex: 1 },
  countryName: { fontSize: 15, fontWeight: '700' },
  duration: { fontSize: 11, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 12 },

  expandBody: {
    borderWidth: 1.5, borderTopWidth: 0, borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12, padding: 14, marginTop: -4,
  },
  notes: { fontSize: 13, lineHeight: 21, marginBottom: 12 },
  iataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  iataTitle: { fontSize: 12, fontWeight: '700' },
  iataChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  iataCode: { fontSize: 12, fontWeight: '800' },
  applyBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  disclaimer: { fontSize: 11, lineHeight: 17 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});
