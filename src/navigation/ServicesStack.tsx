import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../context/SettingsContext';
import { ServicesScreen } from '../screens/ServicesScreen';
import { BookFlightScreen } from '../screens/BookFlightScreen';
import { BookHotelScreen } from '../screens/BookHotelScreen';
import { InsuranceScreen } from '../screens/InsuranceScreen';
import { BaggageTrackScreen } from '../screens/BaggageTrackScreen';
import { WaitingTimeScreen } from '../screens/WaitingTimeScreen';
import { AirlineComplaintScreen } from '../screens/AirlineComplaintScreen';
import { AppWebViewScreen } from '../screens/AppWebViewScreen';

export type ServicesStackParamList = {
  ServicesHub: undefined;
  BookFlight: undefined;
  BookHotel: undefined;
  Insurance: undefined;
  BaggageTrack: undefined;
  WaitingTime: undefined;
  AirlineComplaint: undefined;
  AppWebView: { url: string; title: string };
};

const Stack = createNativeStackNavigator<ServicesStackParamList>();

export function ServicesStack() {
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
        name="ServicesHub"
        component={ServicesScreen}
        options={{ headerTitle: '🛫 Services', headerShown: false }}
      />
      <Stack.Screen
        name="BookFlight"
        component={BookFlightScreen}
        options={{ headerTitle: '🎫 Book Flight' }}
      />
      <Stack.Screen
        name="BookHotel"
        component={BookHotelScreen}
        options={{ headerTitle: '🏨 Book Hotel' }}
      />
      <Stack.Screen
        name="Insurance"
        component={InsuranceScreen}
        options={{ headerTitle: '🛡️ Travel Insurance' }}
      />
      <Stack.Screen
        name="BaggageTrack"
        component={BaggageTrackScreen}
        options={{ headerTitle: '🧳 Baggage Tracking' }}
      />
      <Stack.Screen
        name="WaitingTime"
        component={WaitingTimeScreen}
        options={{ headerTitle: '⏱️ Airport Wait Times' }}
      />
      <Stack.Screen
        name="AirlineComplaint"
        component={AirlineComplaintScreen}
        options={{ headerTitle: '📞 Airline Complaint' }}
      />
      <Stack.Screen
        name="AppWebView"
        component={AppWebViewScreen}
        options={({ route }) => ({ headerTitle: (route.params as any)?.title ?? 'Web' })}
      />
    </Stack.Navigator>
  );
}
