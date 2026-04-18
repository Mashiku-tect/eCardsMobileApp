import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-gesture-handler';
import { checkLoginStatus } from './utils/auth';
import { PermissionsProvider } from './context/PermissionContext';
import { usePermissions } from './context/PermissionContext';

import { setLogoutHandler } from './utils/logout';
import { Appearance } from 'react-native';
import Toast from 'react-native-toast-message';


import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import AppNavigator from './navigation/AppNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  Appearance.setColorScheme('light');

  // Check login status on app start
  useEffect(() => {
    const verifyToken = async () => {
      const token = await checkLoginStatus();
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    verifyToken();
  }, []);

  //logout the User 
  useEffect(() => {
  setLogoutHandler(() => {
    setIsLoggedIn(false);
  });
}, []);


  // Logout function
  const handleLogout = async () => {
    try {
      // Clear any stored tokens or user data
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  function AppGate({ isLoggedIn, onLogin, onLogout }) {
  const { loading: permissionsLoading } = usePermissions();

  // BLOCK navigation until permissions are ready
  if (permissionsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={onLogin} />}
          </Stack.Screen>
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      ) : (
        <Stack.Screen name="MainApp">
          {(props) => (
            <AppNavigator {...props} onLogout={onLogout} />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}


  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

 return (
  <PaperProvider>
    <SafeAreaProvider>
      <PermissionsProvider>
        <NavigationContainer>
          <AppGate
            isLoggedIn={isLoggedIn}
            onLogin={() => setIsLoggedIn(true)}
            onLogout={handleLogout}
          />
        </NavigationContainer>

        <Toast />
      </PermissionsProvider>
    </SafeAreaProvider>
  </PaperProvider>
);

}