import 'react-native-url-polyfill/auto';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RoleRouter from './app/RoleRouter';
import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user } = useContext(AuthContext);
  
  console.log('App user state:', user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens when not logged in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Role-based screens when logged in
          <Stack.Screen name="Main" component={RoleRouter} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  console.log('App component started');

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}


