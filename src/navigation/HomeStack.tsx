import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import { BRAND } from '../constants/brand';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { TripDashboardScreen } from '../screens/TripDashboardScreen';
import { AddFlightScreen } from '../screens/AddFlightScreen';
import { LeaveByScreen } from '../screens/LeaveByScreen';
import { DocChecklistScreen } from '../screens/DocChecklistScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { useSettings } from '../context/SettingsContext';
import { lightColors } from '../theme';
import { haptic } from '../services/HapticService';
import { CalmModeScreen } from '../screens/CalmModeScreen';
import { BaggageRulesScreen } from '../screens/BaggageRulesScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { FrequentFlyerScreen } from '../screens/FrequentFlyerScreen';
import { VisaScreen } from '../screens/VisaScreen';
import { SearchScreen } from '../screens/SearchScreen';

export type HomeStackParamList = {
  TripDashboard: undefined;
  AddFlight: undefined;
  LeaveBy: undefined;
  DocChecklist: undefined;
  CalmMode: undefined;
  BaggageRules: undefined;
  Premium: undefined;
  FrequentFlyer: undefined;
  Visa: undefined;
  Search: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();


// ─── Social links ─────────────────────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: '𝕏', label: '@readytofly.in', platform: 'Twitter', url: BRAND.TWITTER },
  { icon: '📸', label: '@readytofly.in', platform: 'Instagram', url: BRAND.INSTAGRAM },
  { icon: '▶️', label: '@readytoflyapp', platform: 'YouTube', url: BRAND.YOUTUBE },
  { icon: '👍', label: 'Ready To Fly', platform: 'Facebook', url: BRAND.FACEBOOK },
] as const;
// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerButton() {
  const [visible, setVisible] = useState(false);
  const { isDarkMode, toggleDarkMode, language, setLanguage, t, themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  const open  = () => setVisible(true);
  const close = () => setVisible(false);
  const goTo  = (screen: 'PrivacyPolicy' | 'TermsOfService' | 'Premium') => {
    close();
    setTimeout(() => navigation.navigate(screen), 150);
  };
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <>
      <TouchableOpacity onPress={open} style={styles.hamburgerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={close} />
        <SafeAreaView style={[styles.drawer, { backgroundColor: c.card }]}>
          <StatusBar
            backgroundColor={isDarkMode ? c.background : lightColors.primary}
            barStyle="light-content"
          />
          <View style={[styles.drawerHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.drawerTitle, { color: c.text }]}>{t.settingsTitle}</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.closeBtn, { color: c.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.row, { borderBottomColor: c.border }]}>
            <Text style={styles.rowIcon}>🌙</Text>
            <Text style={[styles.rowLabel, { color: c.text }]}>{t.darkMode}</Text>
            <Switch value={isDarkMode} onValueChange={() => { haptic.selection(); toggleDarkMode(); }} trackColor={{ false: '#D1D5DB', true: c.primary }} thumbColor={lightColors.white} />
          </View>

          <View style={[styles.langSection, { borderBottomColor: c.border }]}>
            <View style={styles.langHeader}>
              <Text style={styles.rowIcon}>🌐</Text>
              <Text style={[styles.rowLabel, { color: c.text }]}>{t.language}</Text>
            </View>
            <View style={styles.langOptions}>
              {([
                { code: 'en', flag: '🇬🇧', name: 'English' },
                { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
                { code: 'ta', flag: '🇮🇳', name: 'தமிழ்' },
                { code: 'te', flag: '🇮🇳', name: 'తెలుగు' },
                { code: 'kn', flag: '🇮🇳', name: 'ಕನ್ನಡ' },
                { code: 'bn', flag: '🇮🇳', name: 'বাংলা' },
                { code: 'mr', flag: '🇮🇳', name: 'मराठी' },
              ] as const).map(({ code, flag, name }) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langOption, { borderColor: c.border, backgroundColor: c.background }, language === code && { borderColor: c.primary, backgroundColor: c.primary + '18' }]}
                  onPress={() => setLanguage(code)}>
                  <Text style={[styles.langOptionText, { color: c.text }, language === code && { color: c.primary, fontWeight: '700' }]}>
                    {flag}  {name}
                  </Text>
                  {language === code && <Text style={{ color: c.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.row, { borderBottomColor: c.border, backgroundColor: c.primary + '10' }]} onPress={() => { haptic.impact(); goTo('Premium'); }}>
            <Text style={styles.rowIcon}>👑</Text>
            <Text style={[styles.rowLabel, { color: c.primary, fontWeight: '800' }]}>{t.upgradePremium}</Text>
            <Text style={[styles.rowChevron, { color: c.primary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => goTo('PrivacyPolicy')}>
            <Text style={styles.rowIcon}>🔒</Text>
            <Text style={[styles.rowLabel, { color: c.text }]}>{t.privacyPolicy}</Text>
            <Text style={[styles.rowChevron, { color: c.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => goTo('TermsOfService')}>
            <Text style={styles.rowIcon}>📄</Text>
            <Text style={[styles.rowLabel, { color: c.text }]}>{t.termsOfService}</Text>
            <Text style={[styles.rowChevron, { color: c.textSecondary }]}>›</Text>
          </TouchableOpacity>

            {/* ─── Follow Us ──────────────────────────────────────────────────────── */}
            <View style={[styles.followDivider, { borderTopColor: c.border }]} />
            <View style={styles.followHeader}>
              <Text style={[styles.followTitle, { color: c.textSecondary }]}>FOLLOW US</Text>
            </View>

            {SOCIAL_LINKS.map(({ icon, label, platform, url }) => (
              <TouchableOpacity
                key={platform}
                style={[styles.row, { borderBottomColor: c.border }]}
                onPress={() => openLink(url)}
                activeOpacity={0.7}>
                <Text style={styles.rowIcon}>{icon}</Text>
                <View style={styles.socialTextGroup}>
                  <Text style={[styles.rowLabel, { color: c.text }]}>{platform}</Text>
                  <Text style={[styles.socialHandle, { color: c.textSecondary }]}>{label}</Text>
                </View>
                <Text style={[styles.externalIcon, { color: c.textSecondary }]}>↗</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.version, { color: c.textSecondary }]}>{t.appVersion}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ─── Stack ────────────────────────────────────────────────────────────────────
export function HomeStack() {
  const { themeColors: c } = useSettings();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: c.primary },
        headerTintColor: c.white,
        headerTitleStyle: { fontWeight: '800' },
        headerBackTitle: 'Back',
      }}>
      <Stack.Screen
        name="TripDashboard"
        component={TripDashboardScreen}
        options={{
          headerTitle: 'FlyEasy ✈️',
          headerRight: () => <HamburgerButton />,
        }}
      />
      <Stack.Screen
        name="AddFlight"
        component={AddFlightScreen}
        options={{ headerTitle: '✈️ Add Flight' }}
      />
      <Stack.Screen
        name="LeaveBy"
        component={LeaveByScreen}
        options={{ headerTitle: '🕐 Leave-By Calculator' }}
      />
      <Stack.Screen
        name="DocChecklist"
        component={DocChecklistScreen}
        options={{ headerTitle: '📋 Document Checklist' }}
      />
      <Stack.Screen
        name="CalmMode"
        component={CalmModeScreen}
        options={{ headerTitle: '😌 Calm Mode', headerShown: false }}
      />
      <Stack.Screen
        name="BaggageRules"
        component={BaggageRulesScreen}
        options={{ headerTitle: '🧳 Baggage Rules' }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ headerTitle: '👑 FlyEasy Premium' }}
      />
      <Stack.Screen
        name="FrequentFlyer"
        component={FrequentFlyerScreen}
        options={{ headerTitle: '🏅 Frequent Flyer' }}
      />
      <Stack.Screen
        name="Visa"
        component={VisaScreen}
        options={{ headerTitle: '🌍 Visa Requirements' }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerTitle: '🔒 Privacy Policy' }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ headerTitle: '📄 Terms of Service' }}
      />
    </Stack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hamburgerBtn: { marginRight: 4, padding: 4 },
  hamburgerIcon: { fontSize: 22, color: '#FFFFFF' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%', elevation: 16, shadowColor: '#000', shadowOffset: { width: -3, height: 0 }, shadowOpacity: 0.25, shadowRadius: 12 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  drawerTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { fontSize: 20, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { fontSize: 20, width: 32 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowChevron: { fontSize: 20, fontWeight: '300' },
  langSection: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  langHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  langOptions: { gap: 8 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  langOptionText: { fontSize: 14, fontWeight: '500' },
  scrollContent: { flexGrow: 1 },
  followDivider: { borderTopWidth: 1, marginTop: 4 },
  followHeader: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  followTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  socialTextGroup: { flex: 1, gap: 2 },
  socialHandle: { fontSize: 12, fontWeight: '400' },
  externalIcon: { fontSize: 16, fontWeight: '400' },
  version: { textAlign: 'center', fontSize: 12, paddingBottom: 24, paddingTop: 16 },
});
