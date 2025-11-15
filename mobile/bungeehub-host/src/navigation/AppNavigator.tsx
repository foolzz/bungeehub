/**
 * App Navigator
 * Main navigation structure
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import apiService from '../services/api.service';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import DeliveryDetailsScreen from '../screens/DeliveryDetailsScreen';
import ProofOfDeliveryScreen from '../screens/ProofOfDeliveryScreen';
import RouteMapScreen from '../screens/RouteMapScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await apiService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isAuthenticated === null) {
    // Loading state
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
        ) : (
          // App screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen
              name="DeliveryDetails"
              component={DeliveryDetailsScreen}
            />
            <Stack.Screen
              name="ProofOfDelivery"
              component={ProofOfDeliveryScreen}
            />
            <Stack.Screen name="RouteMap" component={RouteMapScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
