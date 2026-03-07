import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'Premium upgrade with Razorpay will be available in the next update!',
    );
  };

  const handlePref = (label: string) => {
    Alert.alert(label, `${label} settings coming soon!`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        {user ? (
          <>
            <Text style={styles.name}>Welcome back!</Text>
            <Text style={styles.email}>
              {user.phoneNumber || 'Verified User'}
            </Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>Welcome to FlyEasy!</Text>
            <Text style={styles.email}>Sign in to save your preferences</Text>
            <TouchableOpacity style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Sign In with Phone</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {[
          { icon: '🌐', label: 'Language', value: 'English' },
          { icon: '🔔', label: 'Notifications', value: 'On' },
          { icon: '✈️', label: 'Frequent Airlines', value: 'Not set' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.prefRow}
            onPress={() => handlePref(item.label)}>
            <Text style={styles.prefIcon}>{item.icon}</Text>
            <Text style={styles.prefLabel}>{item.label}</Text>
            <Text style={styles.prefValue}>{item.value} ›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Go Premium</Text>
        <View style={styles.premiumCard}>
          <Text style={styles.premiumTitle}>✨ Remove All Ads</Text>
          <Text style={styles.premiumDesc}>
            Rs 99/month · Rs 499/year · Rs 4,999 lifetime
          </Text>
          <TouchableOpacity style={styles.premiumBtn} onPress={handleUpgrade}>
            <Text style={styles.premiumBtnText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
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
  avatarBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 28,
    marginBottom: 20,
    elevation: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  loginBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  signOutBtnText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  prefIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  prefLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  prefValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  premiumCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  premiumDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumBtn: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  premiumBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});
