/**
 * Delivery Details Screen
 * View delivery details and take actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import apiService from '../services/api.service';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveryDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      delivery: Delivery;
      deliveryId?: string;
    };
  };
}

export default function DeliveryDetailsScreen({
  navigation,
  route,
}: DeliveryDetailsScreenProps) {
  const [delivery, setDelivery] = useState<Delivery | null>(
    route.params.delivery || null
  );
  const [loading, setLoading] = useState(!route.params.delivery);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route.params.deliveryId && !route.params.delivery) {
      loadDelivery();
    }
  }, []);

  const loadDelivery = async () => {
    try {
      const data = await apiService.getDelivery(route.params.deliveryId!);
      setDelivery(data);
    } catch (error: any) {
      console.error('Error loading delivery:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load delivery'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDelivery();
  };

  const handleSubmitPOD = () => {
    if (!delivery) return;
    navigation.navigate('ProofOfDelivery', { delivery });
  };

  const handleMarkFailed = () => {
    if (!delivery) return;

    Alert.prompt(
      'Mark as Failed',
      'Please provide a reason for the failed delivery:',
      async (reason) => {
        if (!reason || !reason.trim()) {
          Alert.alert('Error', 'Please provide a reason');
          return;
        }

        try {
          const updated = await apiService.markDeliveryFailed(delivery.id, reason);
          setDelivery(updated);
          Alert.alert('Success', 'Delivery marked as failed');
        } catch (error: any) {
          console.error('Error marking failed:', error);
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to update delivery'
          );
        }
      }
    );
  };

  const handleOpenMap = () => {
    if (!delivery?.package?.deliveryAddress) {
      Alert.alert('Error', 'No delivery address available');
      return;
    }

    const address = encodeURIComponent(delivery.package.deliveryAddress);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  };

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canSubmitPOD =
    delivery.status === DeliveryStatus.PENDING ||
    delivery.status === DeliveryStatus.IN_PROGRESS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Details</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(delivery.status) },
          ]}
        >
          <Text style={styles.statusText}>{delivery.status}</Text>
        </View>

        {/* Package Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tracking Number:</Text>
            <Text style={styles.value}>
              {delivery.package?.trackingNumber || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Barcode:</Text>
            <Text style={styles.value}>
              {delivery.package?.barcode || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>
              {delivery.package?.status || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Recipient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{delivery.recipientName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>
              {delivery.package?.deliveryAddress || 'N/A'}
            </Text>
          </View>
          {delivery.package?.deliveryAddress && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleOpenMap}
            >
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>
              {new Date(delivery.createdAt).toLocaleString()}
            </Text>
          </View>
          {delivery.deliveredAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Delivered:</Text>
              <Text style={styles.value}>
                {new Date(delivery.deliveredAt).toLocaleString()}
              </Text>
            </View>
          )}
          {delivery.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{delivery.notes}</Text>
            </View>
          )}
        </View>

        {/* Proof of Delivery */}
        {delivery.proofOfDeliveryUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proof of Delivery</Text>
            <Text style={styles.label}>Photo URL:</Text>
            <Text style={styles.value} numberOfLines={1}>
              {delivery.proofOfDeliveryUrl}
            </Text>
            {delivery.deliveryLatitude && delivery.deliveryLongitude && (
              <Text style={styles.value}>
                Location: {Number(delivery.deliveryLatitude).toFixed(6)},{' '}
                {Number(delivery.deliveryLongitude).toFixed(6)}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {canSubmitPOD && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
            onPress={handleSubmitPOD}
          >
            <Text style={styles.actionButtonText}>Submit Proof of Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f44336' }]}
            onPress={handleMarkFailed}
          >
            <Text style={styles.actionButtonText}>Mark as Failed</Text>
          </TouchableOpacity>
        </View>
      )}
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
  refreshText: {
    color: '#1a73e8',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  statusBadge: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  mapButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
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
