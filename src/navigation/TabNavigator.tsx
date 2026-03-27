import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeStack } from './HomeStack';
import { AirportGuideScreen } from '../screens/AirportGuideScreen';
import { MyFlightsScreen } from '../screens/MyFlightsScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useSettings } from '../context/SettingsContext';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export function TabNavigator() {
  const { themeColors: c, isDarkMode } = useSettings();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: isDarkMode ? c.card : c.white,
          borderTopColor: c.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          color: c.textSecondary,
        },
        headerStyle: {
          backgroundColor: isDarkMode ? c.card : c.primary,
        },
        headerTintColor: c.white,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Airport Guide"
        component={AirportGuideScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" focused={focused} />
          ),
          tabBarLabel: 'Airports',
        }}
      />
      <Tab.Screen
        name="My Flights"
        component={MyFlightsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✈️" focused={focused} />
          ),
          tabBarLabel: 'My Flights',
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
          headerTitle: '👤 My Account',
        }}
      />
    </Tab.Navigator>
  );
}
