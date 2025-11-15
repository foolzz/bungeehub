/**
 * Proof of Delivery Screen
 * Capture photo and submit proof of delivery
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import apiService from '../services/api.service';
import { Delivery } from '../types';

interface ProofOfDeliveryScreenProps {
  navigation: any;
  route: {
    params: {
      delivery: Delivery;
    };
  };
}

export default function ProofOfDeliveryScreen({
  navigation,
  route,
}: ProofOfDeliveryScreenProps) {
  const { delivery } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState(
    delivery.recipientName || delivery.package?.recipientName || ''
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setHasPermission(cameraStatus === 'granted');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      setPhotoUri(photo.uri);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return;
    }

    setSubmitting(true);

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

      // Upload photo
      const photoUrl = await apiService.uploadImage(photoUri);

      // Submit proof of delivery
      await apiService.submitProofOfDelivery(delivery.id, {
        proofOfDeliveryUrl: photoUrl,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        recipientName: recipientName.trim(),
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Success',
        'Proof of delivery submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting POD:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit proof of delivery'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
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

  if (showCamera) {
    return (
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
        >
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              onPress={() => setShowCamera(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraFooter}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </Camera>
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
        <Text style={styles.title}>Proof of Delivery</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Package Info */}
        <View style={styles.packageInfo}>
          <Text style={styles.label}>Package:</Text>
          <Text style={styles.trackingNumber}>
            {delivery.package?.trackingNumber}
          </Text>
          <Text style={styles.address}>
            {delivery.package?.deliveryAddress}
          </Text>
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Photo *</Text>

          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: '#1a73e8' }]}
                onPress={() => setShowCamera(true)}
              >
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: '#666' }]}
                onPress={handlePickImage}
              >
                <Text style={styles.photoButtonText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recipient Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Name *</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Enter recipient name"
            editable={!submitting}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any delivery notes..."
            multiline
            numberOfLines={4}
            editable={!submitting}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Proof of Delivery</Text>
          )}
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  packageInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  photoButtons: {
    gap: 10,
  },
  photoButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  retakeButton: {
    padding: 12,
    backgroundColor: '#666',
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    margin: 15,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
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
  camera: {
    flex: 1,
  },
  cameraHeader: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a73e8',
  },
});
