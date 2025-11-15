/**
 * Registration Screen
 * Multi-step registration process for hub hosts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import apiService from '../services/api.service';
import { UserRole, RegisterDto, CreateHubDto } from '../types';

interface RegistrationScreenProps {
  navigation: any;
  onRegistrationSuccess: () => void;
}

export default function RegistrationScreen({
  navigation,
  onRegistrationSuccess,
}: RegistrationScreenProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Step 2: Address
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('USA');

  // Step 3: Hub Property Details
  const [hubName, setHubName] = useState('');
  const [hubAddress, setHubAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [storageAreaSqFt, setStorageAreaSqFt] = useState('');
  const [hasSecuredArea, setHasSecuredArea] = useState(false);
  const [hasCameraSystem, setHasCameraSystem] = useState(false);
  const [hasParkingSpace, setHasParkingSpace] = useState(false);
  const [operatingHours, setOperatingHours] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');

  // Step 4: Hub Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 5: Bank Info
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountLast4, setBankAccountLast4] = useState('');

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (
      cameraStatus !== 'granted' ||
      mediaStatus !== 'granted' ||
      locationStatus !== 'granted'
    ) {
      Alert.alert(
        'Permissions Required',
        'This app needs camera, photo library, and location permissions to function properly.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 10)); // Max 10 photos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!fullName || !email || !password || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!streetAddress || !city || !state || !postalCode) {
      Alert.alert('Error', 'Please fill in all address fields');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!hubName || !hubAddress || !propertyType) {
      Alert.alert('Error', 'Please fill in all hub property fields');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (photos.length < 3) {
      Alert.alert(
        'Error',
        'Please upload at least 3 photos of your property'
      );
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;

    if (step < 5) {
      setStep(step + 1);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Step 1: Upload photos
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await apiService.uploadMultipleImages(photos);
      }

      // Step 2: Register user
      const registerData: RegisterDto = {
        email,
        password,
        fullName,
        phoneNumber,
        role: UserRole.HUB_HOST,
        dateOfBirth,
        streetAddress,
        city,
        state,
        postalCode,
        country,
      };

      await apiService.register(registerData);

      // Step 3: Get current location for hub
      const location = await Location.getCurrentPositionAsync({});

      // Step 4: Create hub application
      const hubData: CreateHubDto = {
        name: hubName,
        address: hubAddress,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        propertyType,
        storageAreaSqFt: storageAreaSqFt ? parseInt(storageAreaSqFt) : undefined,
        hasSecuredArea,
        hasCameraSystem,
        hasParkingSpace,
        operatingHours,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Default
        applicationNotes,
      };

      await apiService.createHub(hubData);

      Alert.alert(
        'Success!',
        'Your application has been submitted and is pending review. You will be notified once approved.',
        [{ text: 'OK', onPress: onRegistrationSuccess }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Step 1: Basic Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={fullName}
        onChangeText={setFullName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (MM/DD/YYYY)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        keyboardType="numbers-and-punctuation"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password *"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Step 2: Your Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Street Address *"
        value={streetAddress}
        onChangeText={setStreetAddress}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="City *"
        value={city}
        onChangeText={setCity}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="State *"
        value={state}
        onChangeText={setState}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Postal Code *"
        value={postalCode}
        onChangeText={setPostalCode}
        keyboardType="number-pad"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
        editable={!loading}
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Step 3: Hub Property Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Hub Name *"
        value={hubName}
        onChangeText={setHubName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Hub Address *"
        value={hubAddress}
        onChangeText={setHubAddress}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Property Type (e.g., House, Apartment) *"
        value={propertyType}
        onChangeText={setPropertyType}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Storage Area (sq ft)"
        value={storageAreaSqFt}
        onChangeText={setStorageAreaSqFt}
        keyboardType="number-pad"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Operating Hours (e.g., 9 AM - 6 PM)"
        value={operatingHours}
        onChangeText={setOperatingHours}
        editable={!loading}
      />

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setHasSecuredArea(!hasSecuredArea)}
          disabled={loading}
        >
          <View
            style={[
              styles.checkboxBox,
              hasSecuredArea && styles.checkboxBoxChecked,
            ]}
          >
            {hasSecuredArea && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Has Secured Area</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setHasCameraSystem(!hasCameraSystem)}
          disabled={loading}
        >
          <View
            style={[
              styles.checkboxBox,
              hasCameraSystem && styles.checkboxBoxChecked,
            ]}
          >
            {hasCameraSystem && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Has Camera System</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setHasParkingSpace(!hasParkingSpace)}
          disabled={loading}
        >
          <View
            style={[
              styles.checkboxBox,
              hasParkingSpace && styles.checkboxBoxChecked,
            ]}
          >
            {hasParkingSpace && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Has Parking Space</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional Notes (optional)"
        value={applicationNotes}
        onChangeText={setApplicationNotes}
        multiline
        numberOfLines={4}
        editable={!loading}
      />
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.stepTitle}>Step 4: Property Photos</Text>
      <Text style={styles.subtitle}>
        Upload at least 3 photos of your property (max 10)
      </Text>

      <ScrollView horizontal style={styles.photosContainer}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <img
              src={photo}
              style={styles.photo as any}
              alt={`Property ${index + 1}`}
            />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => removePhoto(index)}
            >
              <Text style={styles.removePhotoText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 10 && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={pickImage}
            disabled={loading}
          >
            <Text style={styles.addPhotoText}>+</Text>
            <Text style={styles.addPhotoLabel}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text style={styles.photoCount}>
        {photos.length} photo{photos.length !== 1 ? 's' : ''} added
      </Text>
    </>
  );

  const renderStep5 = () => (
    <>
      <Text style={styles.stepTitle}>Step 5: Bank Information (Optional)</Text>
      <Text style={styles.subtitle}>
        This information will be used for payments. You can add this later.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Account Holder Name"
        value={bankAccountName}
        onChangeText={setBankAccountName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Last 4 Digits of Account"
        value={bankAccountLast4}
        onChangeText={setBankAccountLast4}
        keyboardType="number-pad"
        maxLength={4}
        editable={!loading}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Become a Hub Host</Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s === step && styles.progressDotActive,
                s < step && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Render current step */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 5 ? 'Submit Application' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1a73e8',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#1a73e8',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressDotCompleted: {
    backgroundColor: '#4caf50',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    marginVertical: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  photosContainer: {
    flexDirection: 'row',
    marginVertical: 15,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    objectFit: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
  },
  addPhotoText: {
    fontSize: 32,
    color: '#1a73e8',
  },
  addPhotoLabel: {
    fontSize: 12,
    color: '#1a73e8',
    marginTop: 5,
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#1a73e8',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#1a73e8',
    fontSize: 14,
  },
});
