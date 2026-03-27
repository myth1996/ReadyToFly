/**
 * SearchScreen - Full-featured in-app search
 * Phase 1 (empty/1 char): grouped category suggestions
 * Phase 2 (2+ chars): Fuse.js fuzzy results with typo tolerance
 */

import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, SafeAreaView, SectionList,
  Platform,
} from 'react-native';
import Fuse from 'fuse.js';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import {
  SEARCH_INDEX, SEARCH_BY_CATEGORY, CATEGORY_ORDER,
  SearchItem, SearchCategory,
} from '../search/searchIndex';
import { useDebouncedValue } from '../hooks/useDebouncedSearch';

// Fuse.js instance (created once, outside component)
const fuse = new Fuse(SEARCH_INDEX, {
  keys: [
    { name: 'title',       weight: 0.5 },
    { name: 'description', weight: 0.25 },
    { name: 'keywords',    weight: 0.25 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

type FuseResult = { item: SearchItem; score?: number };

// Result row
function ResultRow({
  item, onPress, themeColors,
}: { item: SearchItem; onPress: (item: SearchItem) => void; themeColors: any }) {
  const c = themeColors;
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: c.card, borderBottomColor: c.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.72}
    >
      <View style={[styles.iconBox, { backgroundColor: c.primary + '18' }]}>
        <Text style={styles.rowIcon}>{item.icon}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.text }]}>{item.title}</Text>
        <Text style={[styles.rowDesc, { color: c.textSecondary }]} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <Text style={[styles.rowChevron, { color: c.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );
}

// Section header
function SectionHeader({ title, themeColors }: { title: string; themeColors: any }) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

// Empty state
function EmptyState({ query, themeColors }: { query: string; themeColors: any }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        No results for "{query}"
      </Text>
      <Text style={[styles.emptyHint, { color: themeColors.textSecondary }]}>
        Try: "baggage", "calm", "visa", "leave by", "add flight"
      </Text>
    </View>
  );
}

// Main screen
export function SearchScreen() {
  const { themeColors: c, isDarkMode } = useSettings();
  const navigation = useNavigation<any>();
  const { isPremiumUser } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 120);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      haptic.impact();
      const nav = item.navigateTo;
      if (nav.type === 'stack') {
        navigation.goBack();
        setTimeout(() => navigation.navigate('Home', { screen: nav.screen }), 50);
      } else if (nav.type === 'tab') {
        navigation.goBack();
        setTimeout(() => navigation.navigate(nav.tab), 50);
      } else if (nav.type === 'tab-then-stack') {
        navigation.goBack();
        setTimeout(() => navigation.navigate(nav.tab, { screen: nav.screen }), 50);
      }
    },
    [navigation],
  );

  // Phase 2: fuzzy results via Fuse.js
  const fuzzyResults: SearchItem[] = useMemo(() => {
    if (debouncedQuery.length < 2) { return []; }
    return fuse.search(debouncedQuery).map((r: FuseResult) => r.item);
  }, [debouncedQuery]);

  // Phase 1: live-filtered grouped suggestions
  const suggestionSections = useMemo(() => {
    const lc = query.toLowerCase().trim();
    return CATEGORY_ORDER.map(cat => {
      let items = SEARCH_BY_CATEGORY[cat as SearchCategory];
      if (lc.length > 0) {
        items = items
          .filter(
            item =>
              item.title.toLowerCase().includes(lc) ||
              item.description.toLowerCase().includes(lc) ||
              item.keywords.some(k => k.includes(lc)),
          )
          .slice(0, 5);
      }
      return { title: cat, data: items };
    }).filter(s => s.data.length > 0);
  }, [query]);

  const isPhase2 = debouncedQuery.length >= 2;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar
        backgroundColor={isDarkMode ? c.background : c.primary}
        barStyle="light-content"
      />
      {/* Top spacer: status bar + notch clearance */}
      <View style={[styles.topSpacer, { backgroundColor: c.background }]} />
      {/* Search bar */}
      <View style={[styles.searchBarWrap, { backgroundColor: c.background }]}>
      <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          autoFocus
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Search flights, tools, airports..."
          placeholderTextColor={c.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearBtn, { color: c.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>

      {/* Phase 2: Fuse results */}
      {isPhase2 ? (
        fuzzyResults.length > 0 ? (
          <FlatList
            data={fuzzyResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ResultRow item={item} onPress={handleSelect} themeColors={c} />
            )}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <EmptyState query={debouncedQuery} themeColors={c} />
        )
      ) : (
        /* Phase 1: grouped suggestions */
        <SectionList
          sections={suggestionSections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ResultRow item={item} onPress={handleSelect} themeColors={c} />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} themeColors={c} />
          )}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSpacer: {
    height: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 6 : 0,
  },
  searchBarWrap: {
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0, fontWeight: '500' },
  clearBtn: { fontSize: 16, marginLeft: 8, fontWeight: '600' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  rowIcon: { fontSize: 20 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowDesc: { fontSize: 13, fontWeight: '400' },
  rowChevron: { fontSize: 22, fontWeight: '300', marginLeft: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});