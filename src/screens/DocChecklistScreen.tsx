import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { useAuth } from '../context/AuthContext';
import { domesticChecklist, internationalChecklist, ChecklistItem } from '../data/checklistItems';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = 'flyeasy_checklist_';

export function DocChecklistScreen() {
  const { themeColors: c, language } = useSettings();
  const { isPremiumUser } = useAuth();
  const [isInternational, setIsInternational] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const items = isInternational ? internationalChecklist : domesticChecklist;
  const storageKey = STORAGE_KEY + (isInternational ? 'intl' : 'dom');

  // Load from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) { setChecked(JSON.parse(raw)); }
        else { setChecked({}); }
      } catch (_) { setChecked({}); }
      setLoaded(true);
    })();
  }, [storageKey]);

  // Save when checked changes
  useEffect(() => {
    if (!loaded) { return; }
    AsyncStorage.setItem(storageKey, JSON.stringify(checked)).catch(() => {});
  }, [checked, storageKey, loaded]);

  const toggleItem = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const checkedCount = items.filter(i => checked[i.id]).length;
  const progress = items.length > 0 ? checkedCount / items.length : 0;

  const handleToggleType = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsInternational(prev => !prev);
  };

  const handleShare = async () => {
    const title = isInternational ? 'International Flight Checklist' : 'Domestic Flight Checklist';
    const lines = items.map(i => {
      const tick = checked[i.id] ? '✅' : '⬜';
      const label = language === 'hi' ? i.labelHi : i.label;
      return `${tick} ${label}`;
    });
    const text = `✈️ ${title}\n${checkedCount}/${items.length} completed\n\n${lines.join('\n')}\n\n— Shared from ReadyToFly`;
    try {
      await Share.share({ message: text });
    } catch (_) {}
  };

  const handleReset = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChecked({});
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={[styles.heading, { color: c.text }]}>Document Checklist</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>
        {isInternational ? 'International flight' : 'Domestic flight'} — tap items to check off
      </Text>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, !isInternational && { backgroundColor: c.primary }]}
          onPress={() => { if (isInternational) { handleToggleType(); } }}>
          <Text style={[styles.toggleText, !isInternational && { color: '#fff' }]}>
            🇮🇳 Domestic
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, isInternational && { backgroundColor: c.primary }]}
          onPress={() => { if (!isInternational) { handleToggleType(); } }}>
          <Text style={[styles.toggleText, isInternational && { color: '#fff' }]}>
            🌍 International
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: c.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: progress === 1 ? '#10B981' : c.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: c.textSecondary }]}>
        {checkedCount} / {items.length} completed
        {progress === 1 ? '  ✅ All done!' : ''}
      </Text>

      {/* Checklist Items */}
      {items.map((item, index) => {
        const isChecked = !!checked[item.id];
        const label = language === 'hi' ? item.labelHi : item.label;
        const midPoint = Math.floor(items.length / 2);
        return (
          <React.Fragment key={item.id}>
            <TouchableOpacity
              style={[
                styles.itemCard,
                { backgroundColor: c.card },
                isChecked && styles.itemCardChecked,
                isChecked && { borderColor: '#10B981' },
              ]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}>
              <View style={[
                styles.checkbox,
                { borderColor: c.border },
                isChecked && { backgroundColor: '#10B981', borderColor: '#10B981' },
              ]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: c.text },
                      isChecked && styles.itemLabelChecked,
                    ]}>
                    {label}
                  </Text>
                  {item.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemDesc, { color: c.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
            {index === midPoint && !isPremiumUser && (
              <View style={{ alignItems: 'center', paddingVertical: 10, marginVertical: 4 }}>
                <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
              </View>
            )}
          </React.Fragment>
        );
      })}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.primary }]}
          onPress={handleShare}>
          <Text style={styles.actionBtnText}>📤 Share Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border }]}
          onPress={handleReset}>
          <Text style={[styles.actionBtnText, { color: c.text }]}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Airline note */}
      <View style={[styles.noteCard, { backgroundColor: c.primary + '12' }]}>
        <Text style={[styles.noteTitle, { color: c.primary }]}>💡 Airline Tips</Text>
        <Text style={[styles.noteText, { color: c.text }]}>
          • IndiGo: Printed boarding pass required at some terminals{'\n'}
          • Air India: E-boarding pass accepted at all airports{'\n'}
          • SpiceJet: Web check-in opens 48hrs before departure{'\n'}
          • Vistara: DigiYatra available at DEL, BLR, BOM, HYD, PNQ, VNS, KOL
        </Text>
      </View>

      {/* ── Banner Ad (free users) ───────────────────────── */}
      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subheading: { fontSize: 14, marginBottom: 20 },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Progress
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },

  // Items
  itemCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  itemCardChecked: {
    opacity: 0.85,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  itemLabelChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Note
  noteCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 20,
  },
});
