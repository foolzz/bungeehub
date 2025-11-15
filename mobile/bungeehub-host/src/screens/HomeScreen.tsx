/**
 * Home Screen
 * Dashboard showing hub deliveries and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiService from '../services/api.service';
import { Delivery, DeliveryStatus, Hub, User } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [hub, setHub] = useState<Hub | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Load user and hub info
      const [userData, hubData] = await Promise.all([
        apiService.getUser(),
        apiService.getMyHub(),
      ]);

      setUser(userData);
      setHub(hubData);

      // Load deliveries for this hub
      if (hubData) {
        const deliveriesData = await apiService.getHubDeliveries(hubData.id);
        // Sort by status (pending first, then in progress, then others)
        const sorted = deliveriesData.sort((a, b) => {
          const order = {
            [DeliveryStatus.PENDING]: 0,
            [DeliveryStatus.IN_PROGRESS]: 1,
            [DeliveryStatus.DELIVERED]: 2,
            [DeliveryStatus.COMPLETED]: 3,
            [DeliveryStatus.FAILED]: 4,
            [DeliveryStatus.RETURNED]: 5,
          };
          return (order[a.status] || 99) - (order[b.status] || 99);
        });
        setDeliveries(sorted);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load deliveries'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return '#ff9800';
      case DeliveryStatus.IN_PROGRESS:
        return '#2196f3';
      case DeliveryStatus.DELIVERED:
      case DeliveryStatus.COMPLETED:
        return '#4caf50';
      case DeliveryStatus.FAILED:
      case DeliveryStatus.RETURNED:
        return '#f44336';
      default:
        return '#999';
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await apiService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.trackingNumber}>
          {item.package?.trackingNumber || 'N/A'}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.recipientName}>{item.recipientName || 'N/A'}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {item.package?.deliveryAddress || 'No address'}
      </Text>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={1}>
          Note: {item.notes}
        </Text>
      )}

      <Text style={styles.timestamp}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
          <Text style={styles.hubName}>{hub?.name || 'No Hub'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {
              deliveries.filter(
                (d) =>
                  d.status === DeliveryStatus.PENDING ||
                  d.status === DeliveryStatus.IN_PROGRESS
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {
              deliveries.filter(
                (d) =>
                  d.status === DeliveryStatus.DELIVERED ||
                  d.status === DeliveryStatus.COMPLETED
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1a73e8' }]}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.actionButtonText}>Scan Package</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
          onPress={() => navigation.navigate('RouteMap')}
        >
          <Text style={styles.actionButtonText}>View Routes</Text>
        </TouchableOpacity>
      </View>

      {/* Deliveries List */}
      <Text style={styles.sectionTitle}>Deliveries</Text>
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No deliveries yet</Text>
          </View>
        }
      />
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
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  hubName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
