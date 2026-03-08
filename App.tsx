import React, { useEffect, useRef } from 'react';
import { StatusBar, View, ActivityIndicator, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { FlightsProvider, useFlights } from './src/context/FlightsContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { lightColors } from './src/theme';
import { notificationService } from './src/services/NotificationService';
import { smsImportService } from './src/services/SmsImportService';

const GMAIL_ASKED_KEY = 'flyeasy_gmail_asked';

function AppContent() {
  const { user, loading } = useAuth();
  const { themeColors: c } = useSettings();
  const { addFlight } = useFlights();
  const prevUidRef = useRef<string | null>(null);

  // Set up notification channels once on app start
  useEffect(() => {
    notificationService.setup().catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      prevUidRef.current = null;
      return;
    }
    if (prevUidRef.current === user.uid) { return; }
    prevUidRef.current = user.uid;

    // Show SMS import prompt only ONCE ever (persisted across app restarts)
    const checkSmsPrompt = async () => {
      try {
        const asked = await AsyncStorage.getItem(GMAIL_ASKED_KEY);
        if (asked) { return; }
        await AsyncStorage.setItem(GMAIL_ASKED_KEY, 'true');
      } catch (_) {
        return;
      }

      // Slight delay so the dashboard renders before the dialog
      setTimeout(() => {
        Alert.alert(
          '✈️ Auto-Fetch Flight Details?',
          'Allow FlyEasy to scan your SMS for flight booking confirmations?\n\nThis lets us import your trips automatically — no manual entry needed.\n\n🔒 All parsing happens on your phone. Your messages are never sent to any server.',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Allow',
              onPress: async () => {
                try {
                  const bookings = await smsImportService.importBookingsFromSms();
                  if (bookings.length === 0) {
                    Alert.alert('No bookings found', 'We couldn\'t find any flight booking SMS in your inbox. You can add flights manually.');
                    return;
                  }
                  // Show found bookings summary
                  const summary = bookings
                    .slice(0, 3)
                    .map(b => `• ${b.flightNumber} — PNR ${b.pnr}${b.date ? ` (${b.date})` : ''}`)
                    .join('\n');
                  Alert.alert(
                    `Found ${bookings.length} booking${bookings.length > 1 ? 's' : ''}`,
                    `${summary}${bookings.length > 3 ? `\n...and ${bookings.length - 3} more` : ''}\n\nGo to My Flights → Add Flight to track them.`,
                    [{ text: 'OK' }],
                  );
                } catch (_) {
                  Alert.alert('Import Failed', 'Could not read SMS. You can add flights manually.');
                }
              },
            },
          ],
        );
      }, 1200);
    };

    checkSmsPrompt();
  }, [user?.uid, addFlight]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.primary }}>
        <ActivityIndicator size="large" color={lightColors.white} />
      </View>
    );
  }

  return user ? <TabNavigator /> : <AuthNavigator />;
}

function AppWithTheme() {
  const { isDarkMode, themeColors: c } = useSettings();

  return (
    <>
      <StatusBar
        backgroundColor={isDarkMode ? c.background : c.primary}
        barStyle="light-content"
      />
      <AuthProvider>
        <FlightsProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </FlightsProvider>
      </AuthProvider>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppWithTheme />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

export default App;
