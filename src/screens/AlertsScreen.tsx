import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme';

export function AlertsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Alerts</Text>
      <Text style={styles.subheading}>
        Real-time gate changes, delays & boarding
      </Text>

      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No active alerts</Text>
        <Text style={styles.emptyDesc}>
          Once you add a flight, you'll get instant alerts for gate changes,
          delays over 30 minutes, and when boarding begins.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What you'll get notified about:</Text>
        {[
          '🚪 Gate change notifications',
          '⏱️ Delays longer than 30 minutes',
          '📢 Boarding has started',
          '✅ Flight on-time confirmation',
        ].map(item => (
          <Text key={item} style={styles.infoItem}>
            {item}
          </Text>
        ))}
      </View>
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
    marginBottom: 24,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    elevation: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
});
