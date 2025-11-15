/**
 * TypeScript types matching backend models
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  HUB_HOST = 'HUB_HOST',
  CUSTOMER = 'CUSTOMER',
}

export enum PackageStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_HUB = 'AT_HUB',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
}

export enum HubTier {
  NEW_HUB = 'NEW_HUB',
  ACTIVE_HUB = 'ACTIVE_HUB',
  TOP_HUB = 'TOP_HUB',
  SUPER_HUB = 'SUPER_HUB',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hub {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tier: HubTier;
  rating: number;
  totalDeliveries: number;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  trackingNumber: string;
  barcode: string;
  status: PackageStatus;
  assignedHubId?: string;
  batchId?: string;
  recipientName?: string;
  deliveryAddress?: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedHub?: Hub;
}

export interface Delivery {
  id: string;
  packageId: string;
  hubId: string;
  status: DeliveryStatus;
  proofOfDeliveryUrl?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  recipientName?: string;
  notes?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  package?: Package;
  hub?: Hub;
}

export interface ScanPackageDto {
  barcode: string;
  latitude?: number;
  longitude?: number;
}

export interface ProofOfDeliveryDto {
  proofOfDeliveryUrl: string;
  latitude?: number;
  longitude?: number;
  recipientName?: string;
  notes?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Mock package for testing route calculation
export interface MockPackage {
  id: string;
  trackingNumber: string;
  barcode: string;
  recipientName: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  distance?: number; // Distance from hub in km
}

// Route waypoint
export interface RouteWaypoint {
  package: MockPackage;
  order: number;
  estimatedArrival?: Date;
}

// Optimized route
export interface OptimizedRoute {
  waypoints: RouteWaypoint[];
  totalDistance: number; // in km
  estimatedDuration: number; // in minutes
}
