import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import CompanyView from '../../components/company/CompanyView';
import Company2 from '../../components/company/Company2';
import CompanySettings from '../../components/company/CompanySettings';
import About from '../../components/company/About';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function CompanyTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'CompanyHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CompanyTab2') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'CompanyTab3') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'CompanyTab4') {
            iconName = focused ? 'information-circle' : 'information-circle-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 75 + insets.bottom : 65,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
      })}
    >
      <Tab.Screen name="CompanyHome" component={CompanyView} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CompanyTab2" component={Company2} options={{ title: 'Analytics' }} />
      <Tab.Screen name="CompanyTab3" component={CompanySettings} options={{ title: 'Settings' }} />
      <Tab.Screen name="CompanyTab4" component={About} options={{ title: 'About' }} />
    </Tab.Navigator>
  );
}
