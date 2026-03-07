import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeStack } from './HomeStack';
import { AirportGuideScreen } from '../screens/AirportGuideScreen';
import { MyFlightsScreen } from '../screens/MyFlightsScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
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
    </Tab.Navigator>
  );
}
