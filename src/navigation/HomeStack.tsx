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
} from 'react-native';
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

export type HomeStackParamList = {
  TripDashboard: undefined;
  AddFlight: undefined;
  LeaveBy: undefined;
  DocChecklist: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// ─── Hamburger Menu ───────────────────────────────────────────────────────────
function HamburgerButton() {
  const [visible, setVisible] = useState(false);
  const { isDarkMode, toggleDarkMode, language, setLanguage, t, themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  const open  = () => setVisible(true);
  const close = () => setVisible(false);
  const goTo  = (screen: 'PrivacyPolicy' | 'TermsOfService') => {
    close();
    setTimeout(() => navigation.navigate(screen), 150);
  };

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

          <View style={[styles.row, { borderBottomColor: c.border }]}>
            <Text style={styles.rowIcon}>🌙</Text>
            <Text style={[styles.rowLabel, { color: c.text }]}>{t.darkMode}</Text>
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: '#D1D5DB', true: c.primary }} thumbColor={lightColors.white} />
          </View>

          <View style={[styles.langSection, { borderBottomColor: c.border }]}>
            <View style={styles.langHeader}>
              <Text style={styles.rowIcon}>🌐</Text>
              <Text style={[styles.rowLabel, { color: c.text }]}>{t.language}</Text>
            </View>
            <View style={styles.langOptions}>
              {(['en', 'hi'] as const).map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langOption, { borderColor: c.border, backgroundColor: c.background }, language === lang && { borderColor: c.primary, backgroundColor: c.primary + '18' }]}
                  onPress={() => setLanguage(lang)}>
                  <Text style={[styles.langOptionText, { color: c.text }, language === lang && { color: c.primary, fontWeight: '700' }]}>
                    {lang === 'en' ? `🇬🇧 ${t.english}` : `🇮🇳 ${t.hindi}`}
                  </Text>
                  {language === lang && <Text style={{ color: c.primary, fontSize: 14 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

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

          <Text style={[styles.version, { color: c.textSecondary }]}>{t.appVersion}</Text>
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
  version: { textAlign: 'center', fontSize: 12, marginTop: 'auto', paddingBottom: 24, paddingTop: 16 },
});
