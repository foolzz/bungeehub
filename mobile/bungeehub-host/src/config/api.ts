/**
 * API Configuration
 * Update the API_BASE_URL to point to your backend server
 */

// For local development, use your computer's IP address
// For production, use your deployed backend URL
export const API_BASE_URL = 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',

  // Packages
  PACKAGES: '/packages',
  PACKAGE_BY_BARCODE: (barcode: string) => `/packages/barcode/${barcode}`,
  PACKAGE_BY_TRACKING: (trackingNumber: string) => `/packages/tracking/${trackingNumber}`,

  // Scanning
  SCAN_PACKAGE: '/scanning/package',
  SCAN_BATCH: '/scanning/batch',
  PACKAGE_SCAN_HISTORY: (packageId: string) => `/scanning/package/${packageId}/history`,

  // Deliveries
  DELIVERIES: '/deliveries',
  HUB_DELIVERIES: (hubId: string) => `/deliveries/hub/${hubId}`,
  PROOF_OF_DELIVERY: (deliveryId: string) => `/deliveries/${deliveryId}/proof-of-delivery`,
  MARK_FAILED: (deliveryId: string) => `/deliveries/${deliveryId}/mark-failed`,

  // Hubs
  HUBS: '/hubs',
  MY_HUB: '/hubs/my-hub',
  CREATE_HUB: '/hubs',

  // Upload
  UPLOAD_SINGLE: '/upload/single',
  UPLOAD_MULTIPLE: '/upload/multiple',

  // Messages
  MESSAGES: '/messages',
  INBOX: '/messages/inbox',
  SENT_MESSAGES: '/messages/sent',
  CONVERSATIONS: '/messages/conversations',
  CONVERSATION: (userId: string) => `/messages/conversation/${userId}`,
  UNREAD_COUNT: '/messages/unread-count',
  MARK_READ: (messageId: string) => `/messages/${messageId}/read`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  UNREAD_NOTIFICATIONS: '/notifications/unread-count',
  MARK_NOTIFICATION_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
  MARK_ALL_READ: '/notifications/mark-all-read',
};
