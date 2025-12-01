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

export enum HubStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationCategory {
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  PACKAGE_DELIVERY = 'PACKAGE_DELIVERY',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced profile fields
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Verification
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isIdVerified?: boolean;
  idDocumentUrl?: string;
  idDocumentType?: string;
  // Payment
  bankAccountLast4?: string;
  bankAccountName?: string;
  stripeAccountId?: string;
  // Preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  lastLoginAt?: string;
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
  status: HubStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Property details
  propertyType?: string;
  storageAreaSqFt?: number;
  hasSecuredArea?: boolean;
  hasCameraSystem?: boolean;
  hasParkingSpace?: boolean;
  operatingHours?: string;
  availableDays?: string[];
  preferredDeliveryTime?: string;
  // Application & review
  applicationNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  activatedAt?: string;
  photos?: HubPhoto[];
}

export interface HubPhoto {
  id: string;
  hubId: string;
  photoUrl: string;
  description?: string;
  photoType: string;
  displayOrder: number;
  isApproved: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  hubId?: string;
  subject?: string;
  content: string;
  status: MessageStatus;
  readAt?: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
  hub?: Hub;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
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

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  // Enhanced fields
  dateOfBirth?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateHubDto {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  // Property details
  propertyType?: string;
  storageAreaSqFt?: number;
  hasSecuredArea?: boolean;
  hasCameraSystem?: boolean;
  hasParkingSpace?: boolean;
  operatingHours?: string;
  availableDays?: string[];
  preferredDeliveryTime?: string;
  applicationNotes?: string;
}

export interface SendMessageDto {
  receiverId: string;
  hubId?: string;
  subject?: string;
  content: string;
}

export interface Conversation {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
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
