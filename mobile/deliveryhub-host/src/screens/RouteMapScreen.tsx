/**
 * Route Map Screen
 * View optimized delivery route on map with navigation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import apiService from '../services/api.service';
import {
  generateMockPackages,
  optimizeRouteNearestNeighbor,
  formatDistance,
  formatDuration,
} from '../utils/mockData';
import { Hub, OptimizedRoute, MockPackage } from '../types';

interface RouteMapScreenProps {
  navigation: any;
}

export default function RouteMapScreen({ navigation }: RouteMapScreenProps) {
  const [hub, setHub] = useState<Hub | null>(null);
  const [mockPackages, setMockPackages] = useState<MockPackage[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPackageList, setShowPackageList] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get hub info
      const hubData = await apiService.getMyHub();
      setHub(hubData);

      // Generate mock packages near the hub
      const packages = generateMockPackages(
        Number(hubData.latitude),
        Number(hubData.longitude),
        25, // 25 packages
        10 // within 10km radius
      );
      setMockPackages(packages);

      // Optimize route
      const route = optimizeRouteNearestNeighbor(
        Number(hubData.latitude),
        Number(hubData.longitude),
        packages
      );
      setOptimizedRoute(route);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load route data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartNavigation = () => {
    if (!optimizedRoute || optimizedRoute.waypoints.length === 0) {
      Alert.alert('Error', 'No route available');
      return;
    }

    const firstStop = optimizedRoute.waypoints[0].package;
    const address = encodeURIComponent(firstStop.deliveryAddress);

    Alert.alert(
      'Start Navigation',
      `Navigate to: ${firstStop.recipientName}\n${firstStop.deliveryAddress}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Google Maps',
          onPress: () => {
            const url = `https://maps.google.com/?daddr=${firstStop.latitude},${firstStop.longitude}`;
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  const handleNavigateToStop = (pkg: MockPackage) => {
    const url = `https://maps.google.com/?daddr=${pkg.latitude},${pkg.longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!hub || !optimizedRoute) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load route</Text>
        <TouchableOpacity style={styles.button} onPress={loadData}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate map region
  const allLatitudes = [
    Number(hub.latitude),
    ...mockPackages.map((p) => p.latitude),
  ];
  const allLongitudes = [
    Number(hub.longitude),
    ...mockPackages.map((p) => p.longitude),
  ];

  const minLat = Math.min(...allLatitudes);
  const maxLat = Math.max(...allLatitudes);
  const minLng = Math.min(...allLongitudes);
  const maxLng = Math.max(...allLongitudes);

  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };

  // Create polyline coordinates for route
  const routeCoordinates = [
    { latitude: Number(hub.latitude), longitude: Number(hub.longitude) },
    ...optimizedRoute.waypoints.map((wp) => ({
      latitude: wp.package.latitude,
      longitude: wp.package.longitude,
    })),
    { latitude: Number(hub.latitude), longitude: Number(hub.longitude) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Route</Text>
        <TouchableOpacity
          onPress={() => setShowPackageList(!showPackageList)}
        >
          <Text style={styles.listToggleText}>
            {showPackageList ? 'Map' : 'List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Route Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Stops</Text>
          <Text style={styles.statValue}>{optimizedRoute.waypoints.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>
            {formatDistance(optimizedRoute.totalDistance)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>
            {formatDuration(optimizedRoute.estimatedDuration)}
          </Text>
        </View>
      </View>

      {showPackageList ? (
        // Package List View
        <ScrollView style={styles.listContainer}>
          <Text style={styles.listTitle}>Optimized Route ({optimizedRoute.waypoints.length} stops)</Text>
          <Text style={styles.listSubtitle}>
            Sorted by nearest neighbor algorithm for optimal delivery
          </Text>

          {optimizedRoute.waypoints.map((waypoint, index) => (
            <TouchableOpacity
              key={waypoint.package.id}
              style={styles.packageCard}
              onPress={() => handleNavigateToStop(waypoint.package)}
            >
              <View style={styles.packageHeader}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{waypoint.order}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.packageName}>
                    {waypoint.package.recipientName}
                  </Text>
                  <Text style={styles.packageAddress}>
                    {waypoint.package.deliveryAddress}
                  </Text>
                  <Text style={styles.packageTracking}>
                    {waypoint.package.trackingNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.packageFooter}>
                <Text style={styles.packageDistance}>
                  {formatDistance(waypoint.package.distance || 0)} from hub
                </Text>
                {waypoint.estimatedArrival && (
                  <Text style={styles.packageETA}>
                    ETA: {waypoint.estimatedArrival.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        // Map View
        <MapView
          style={styles.map}
          initialRegion={region}
          provider={PROVIDER_GOOGLE}
        >
          {/* Hub Marker */}
          <Marker
            coordinate={{
              latitude: Number(hub.latitude),
              longitude: Number(hub.longitude),
            }}
            title={hub.name}
            description="Your Hub"
            pinColor="blue"
          />

          {/* Package Markers */}
          {optimizedRoute.waypoints.map((waypoint) => (
            <Marker
              key={waypoint.package.id}
              coordinate={{
                latitude: waypoint.package.latitude,
                longitude: waypoint.package.longitude,
              }}
              title={`#${waypoint.order} - ${waypoint.package.recipientName}`}
              description={waypoint.package.deliveryAddress}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerBadge}>
                  <Text style={styles.markerText}>{waypoint.order}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* Route Polyline */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#1a73e8"
            strokeWidth={3}
          />
        </MapView>
      )}

      {/* Start Navigation Button */}
      <View style={styles.navigationButtonContainer}>
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={handleStartNavigation}
        >
          <Text style={styles.navigationButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#1a73e8',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listToggleText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBadge: {
    backgroundColor: '#f44336',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigationButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navigationButton: {
    backgroundColor: '#4caf50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
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
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    paddingBottom: 5,
    color: '#333',
  },
  listSubtitle: {
    fontSize: 13,
    paddingHorizontal: 15,
    paddingBottom: 15,
    color: '#666',
  },
  packageCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderBadge: {
    backgroundColor: '#1a73e8',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  packageAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  packageTracking: {
    fontSize: 12,
    color: '#999',
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  packageDistance: {
    fontSize: 12,
    color: '#666',
  },
  packageETA: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
});
