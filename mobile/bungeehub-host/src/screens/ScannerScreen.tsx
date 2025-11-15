/**
 * Scanner Screen
 * QR code and barcode scanner for packages
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import apiService from '../services/api.service';
import { Package } from '../types';

interface ScannerScreenProps {
  navigation: any;
}

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Request camera permission
    const { status: cameraStatus } = await BarCodeScanner.requestPermissionsAsync();

    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    setHasPermission(cameraStatus === 'granted');

    if (cameraStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan packages'
      );
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScanning(true);

    try {
      // Get current location
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (error) {
        console.log('Could not get location:', error);
      }

      // Scan package with backend
      const scannedPackage = await apiService.scanPackage({
        barcode: data,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      });

      Alert.alert(
        'Package Scanned',
        `Tracking: ${scannedPackage.trackingNumber}\nStatus: ${scannedPackage.status}`,
        [
          {
            text: 'View Details',
            onPress: () => {
              navigation.replace('PackageDetails', { package: scannedPackage });
            },
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setScanned(false);
              setScanning(false);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.response?.data?.message || 'Failed to scan package. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setScanning(false);
            },
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermissions}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Package</Text>
        <View style={{ width: 60 }} />
      </View>

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      />

      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
      </View>

      <View style={styles.footer}>
        {scanning ? (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanningText}>Processing scan...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.instructionText}>
              Position the QR code or barcode within the frame
            </Text>
            {scanned && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.buttonText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
