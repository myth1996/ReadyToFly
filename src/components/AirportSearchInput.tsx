/**
 * AirportSearchInput — reusable autocomplete input.
 *
 * Accepts any partial IATA code, city name, or airport name.
 * Calls onSelect(iataCode) when the user picks a result.
 * Displays the full name below the selected code for context.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AIRPORTS, AirportEntry } from '../data/airports';
import { useSettings } from '../context/SettingsContext';

type AirportHit = { iata: string } & AirportEntry;

const ALL: AirportHit[] = Object.entries(AIRPORTS).map(([iata, e]) => ({
  iata,
  ...e,
}));

interface Props {
  label: string;
  value: string;                    // IATA code currently selected
  onSelect: (iata: string) => void;
  placeholder?: string;
}

export function AirportSearchInput({ label, value, onSelect, placeholder }: Props) {
  const { themeColors: c } = useSettings();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AirportHit[]>([]);
  const [focused, setFocused] = useState(false);

  const search = useCallback((text: string) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    const q = text.trim().toUpperCase();
    const hits = ALL.filter(a =>
      a.iata.startsWith(q) ||
      a.city.toUpperCase().includes(q) ||
      a.name.toUpperCase().includes(q),
    ).slice(0, 8);
    setResults(hits);
  }, []);

  const pick = (a: AirportHit) => {
    setQuery(a.iata);
    setResults([]);
    onSelect(a.iata);
  };

  const selectedEntry = AIRPORTS[query.toUpperCase()];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: c.text, backgroundColor: c.card, borderColor: focused ? c.primary : c.border },
        ]}
        value={query}
        onChangeText={search}
        placeholder={placeholder ?? 'IATA or city — e.g. DEL or Delhi'}
        placeholderTextColor={c.textSecondary}
        autoCapitalize="characters"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          // Short delay so onPress registers before list disappears
          setTimeout(() => setResults([]), 200);
        }}
        maxLength={20}
      />

      {/* Selected airport hint */}
      {selectedEntry && results.length === 0 && (
        <Text style={[styles.hint, { color: c.textSecondary }]} numberOfLines={1}>
          ✈ {selectedEntry.name}, {selectedEntry.city}
          {selectedEntry.country !== 'India' ? ` (${selectedEntry.country})` : ''}
        </Text>
      )}

      {/* Dropdown */}
      {results.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: c.card, borderColor: c.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {results.map((a, i) => (
              <TouchableOpacity
                key={a.iata}
                style={[
                  styles.option,
                  { borderBottomColor: c.border },
                  i === results.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => pick(a)}>
                <View style={[styles.iataBox, { backgroundColor: c.primary + '18' }]}>
                  <Text style={[styles.iataCode, { color: c.primary }]}>{a.iata}</Text>
                </View>
                <View style={styles.optMeta}>
                  <Text style={[styles.optCity, { color: c.text }]}>{a.city}</Text>
                  <Text style={[styles.optName, { color: c.textSecondary }]} numberOfLines={1}>
                    {a.name}
                    {a.country !== 'India' ? `  ·  ${a.country}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16, zIndex: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 260,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iataBox: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 48,
    alignItems: 'center',
  },
  iataCode: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  optMeta: { flex: 1 },
  optCity: { fontSize: 14, fontWeight: '700' },
  optName: { fontSize: 11, marginTop: 1 },
});
