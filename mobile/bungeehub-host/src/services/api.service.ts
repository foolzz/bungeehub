/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  LoginDto,
  LoginResponse,
  User,
  Package,
  Delivery,
  ScanPackageDto,
  ProofOfDeliveryDto,
  Hub,
} from '../types';

const STORAGE_KEY_TOKEN = '@bungeehub_token';
const STORAGE_KEY_USER = '@bungeehub_user';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    const { access_token, user } = response.data;
    await this.saveToken(access_token);
    await this.saveUser(user);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.api.get<User>(API_ENDPOINTS.ME);
    await this.saveUser(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.clearAuth();
  }

  // Storage methods
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
  }

  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  async getUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(STORAGE_KEY_USER);
    return userJson ? JSON.parse(userJson) : null;
  }

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Package methods
  async getPackageByBarcode(barcode: string): Promise<Package> {
    const response = await this.api.get<Package>(
      API_ENDPOINTS.PACKAGE_BY_BARCODE(barcode)
    );
    return response.data;
  }

  async getPackageByTracking(trackingNumber: string): Promise<Package> {
    const response = await this.api.get<Package>(
      API_ENDPOINTS.PACKAGE_BY_TRACKING(trackingNumber)
    );
    return response.data;
  }

  // Scanning methods
  async scanPackage(data: ScanPackageDto): Promise<Package> {
    const response = await this.api.post<Package>(
      API_ENDPOINTS.SCAN_PACKAGE,
      data
    );
    return response.data;
  }

  async getPackageScanHistory(packageId: string): Promise<any[]> {
    const response = await this.api.get(
      API_ENDPOINTS.PACKAGE_SCAN_HISTORY(packageId)
    );
    return response.data;
  }

  // Delivery methods
  async getHubDeliveries(hubId: string): Promise<Delivery[]> {
    const response = await this.api.get<Delivery[]>(
      API_ENDPOINTS.HUB_DELIVERIES(hubId)
    );
    return response.data;
  }

  async getDelivery(deliveryId: string): Promise<Delivery> {
    const response = await this.api.get<Delivery>(
      `${API_ENDPOINTS.DELIVERIES}/${deliveryId}`
    );
    return response.data;
  }

  async submitProofOfDelivery(
    deliveryId: string,
    data: ProofOfDeliveryDto
  ): Promise<Delivery> {
    const response = await this.api.post<Delivery>(
      API_ENDPOINTS.PROOF_OF_DELIVERY(deliveryId),
      data
    );
    return response.data;
  }

  async markDeliveryFailed(
    deliveryId: string,
    reason: string
  ): Promise<Delivery> {
    const response = await this.api.post<Delivery>(
      API_ENDPOINTS.MARK_FAILED(deliveryId),
      { reason }
    );
    return response.data;
  }

  // Hub methods
  async getMyHub(): Promise<Hub> {
    const response = await this.api.get<Hub>(API_ENDPOINTS.MY_HUB);
    return response.data;
  }

  // Upload image (for proof of delivery)
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();

    // Extract filename from uri
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }
}

export default new ApiService();
