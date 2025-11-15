/**
 * Hub Application Screen
 * Shows the status of the hub host application
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiService from '../services/api.service';
import { Hub, HubStatus } from '../types';

interface HubApplicationScreenProps {
  navigation: any;
}

export default function HubApplicationScreen({
  navigation,
}: HubApplicationScreenProps) {
  const [hub, setHub] = useState<Hub | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHub = async () => {
    try {
      const hubData = await apiService.getMyHub();
      setHub(hubData);
    } catch (error: any) {
      console.error('Error loading hub:', error);
      if (error.response?.status === 404) {
        setHub(null);
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load hub application'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHub();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHub();
  }, []);

  const getStatusColor = (status: HubStatus) => {
    switch (status) {
      case HubStatus.PENDING:
        return '#ff9800';
      case HubStatus.UNDER_REVIEW:
        return '#2196f3';
      case HubStatus.APPROVED:
        return '#4caf50';
      case HubStatus.ACTIVE:
        return '#4caf50';
      case HubStatus.REJECTED:
        return '#f44336';
      case HubStatus.SUSPENDED:
        return '#f44336';
      case HubStatus.INACTIVE:
        return '#999';
      default:
        return '#999';
    }
  };

  const getStatusMessage = (status: HubStatus) => {
    switch (status) {
      case HubStatus.PENDING:
        return 'Your application is pending review. We will notify you once it has been reviewed.';
      case HubStatus.UNDER_REVIEW:
        return 'Your application is currently under review by our team. This usually takes 1-3 business days.';
      case HubStatus.APPROVED:
        return 'Congratulations! Your application has been approved. You can now activate your hub to start receiving packages.';
      case HubStatus.ACTIVE:
        return 'Your hub is active and receiving packages!';
      case HubStatus.REJECTED:
        return 'Unfortunately, your application was not approved. Please see the reason below.';
      case HubStatus.SUSPENDED:
        return 'Your hub has been suspended. Please contact support for more information.';
      case HubStatus.INACTIVE:
        return 'Your hub is currently inactive. You can reactivate it at any time.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!hub) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hub Application</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.noHubText}>No hub application found</Text>
          <Text style={styles.noHubSubtext}>
            You haven't submitted a hub application yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hub Application</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(hub.status) },
            ]}
          >
            <Text style={styles.statusText}>{hub.status}</Text>
          </View>
          <Text style={styles.statusMessage}>
            {getStatusMessage(hub.status)}
          </Text>
        </View>

        {/* Hub Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hub Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hub Name</Text>
            <Text style={styles.detailValue}>{hub.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{hub.address}</Text>
          </View>

          {hub.propertyType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Property Type</Text>
              <Text style={styles.detailValue}>{hub.propertyType}</Text>
            </View>
          )}

          {hub.storageAreaSqFt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Storage Area</Text>
              <Text style={styles.detailValue}>{hub.storageAreaSqFt} sq ft</Text>
            </View>
          )}

          {hub.operatingHours && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operating Hours</Text>
              <Text style={styles.detailValue}>{hub.operatingHours}</Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            {hub.hasSecuredArea && (
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureText}>Secured Area</Text>
              </View>
            )}
            {hub.hasCameraSystem && (
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>📹</Text>
                <Text style={styles.featureText}>Camera System</Text>
              </View>
            )}
            {hub.hasParkingSpace && (
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🅿️</Text>
                <Text style={styles.featureText}>Parking Space</Text>
              </View>
            )}
          </View>
        </View>

        {/* Review Details (if reviewed) */}
        {hub.reviewedAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reviewed On</Text>
              <Text style={styles.detailValue}>
                {new Date(hub.reviewedAt).toLocaleDateString()}
              </Text>
            </View>

            {hub.reviewNotes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Review Notes</Text>
                <Text style={styles.detailValue}>{hub.reviewNotes}</Text>
              </View>
            )}

            {hub.rejectionReason && (
              <View style={[styles.detailRow, styles.rejectionBox]}>
                <Text style={styles.detailLabel}>Rejection Reason</Text>
                <Text style={[styles.detailValue, styles.rejectionText]}>
                  {hub.rejectionReason}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Application Notes */}
        {hub.applicationNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Notes</Text>
            <Text style={styles.notesText}>{hub.applicationNotes}</Text>
          </View>
        )}

        {/* Stats (if active) */}
        {hub.status === HubStatus.ACTIVE && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{hub.totalDeliveries}</Text>
                <Text style={styles.statLabel}>Deliveries</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{hub.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{hub.tier}</Text>
                <Text style={styles.statLabel}>Tier</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#1a73e8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  rejectionBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
  },
  rejectionText: {
    color: '#d32f2f',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  noHubText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  noHubSubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});
