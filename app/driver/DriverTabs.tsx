import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import DriverView from '../../components/driver/DriverView';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

function DummyDriverTab() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Driver Tab 2 (Sample)</Text>
    </View>
  );
}

export default function DriverTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'DriverHome') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'DriverTab2') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
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
      <Tab.Screen name="DriverHome" component={DriverView} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="DriverTab2" component={DummyDriverTab} options={{ title: 'Reports' }} />
    </Tab.Navigator>
  );
}
