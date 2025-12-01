'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface PackageInfo {
  id: string;
  trackingNumber: string;
  barcode: string;
  status: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  createdAt: string;
  updatedAt: string;
  batch?: {
    id: string;
    batchNumber: string;
    hub: {
      id: string;
      name: string;
      address: string;
      latitude?: number;
      longitude?: number;
    };
  };
  delivery?: {
    id: string;
    status: string;
    deliveredAt?: string;
    proofOfDeliveryUrl?: string;
    signatureUrl?: string;
  };
  eventLogs: Array<{
    id: string;
    eventType: string;
    message?: string;
    createdAt: string;
    latitude?: number;
    longitude?: number;
  }>;
}

export default function TrackPackagePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultIcon, setDefaultIcon] = useState<any>(null);

  // Initialize leaflet icon only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { Icon } = require('leaflet');
      setDefaultIcon(
        new Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a tracking number or barcode');
      return;
    }

    setLoading(true);
    setError(null);
    setPackageInfo(null);

    try {
      // Try to fetch by tracking number first
      let response = await fetch(
        `/api/v1/packages/tracking/${encodeURIComponent(searchQuery)}`,
      );

      // If not found, try by barcode
      if (!response.ok && response.status === 404) {
        response = await fetch(`/api/v1/packages/barcode/${encodeURIComponent(searchQuery)}`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Package not found. Please check your tracking number.');
        }
        throw new Error('Failed to fetch package information');
      }

      const data = await response.json();
      setPackageInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-500',
      CREATED: 'bg-blue-500',
      IN_TRANSIT: 'bg-yellow-500',
      AT_HUB: 'bg-purple-500',
      OUT_FOR_DELIVERY: 'bg-orange-500',
      DELIVERED: 'bg-green-500',
      FAILED: 'bg-red-500',
      RETURNED: 'bg-red-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Package</h1>
          <p className="text-gray-600 mb-6">
            Enter your tracking number or barcode to see the status of your delivery
          </p>

          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter tracking number or barcode"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {packageInfo && (
          <div className="space-y-6">
            {/* Package Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Package Status</h2>
                <span
                  className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(packageInfo.status)}`}
                >
                  {getStatusText(packageInfo.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="text-lg font-semibold">{packageInfo.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Barcode</p>
                  <p className="text-lg font-semibold">{packageInfo.barcode}</p>
                </div>
                {packageInfo.recipientName && (
                  <div>
                    <p className="text-sm text-gray-600">Recipient</p>
                    <p className="text-lg font-semibold">{packageInfo.recipientName}</p>
                  </div>
                )}
                {packageInfo.deliveryAddress && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="text-lg font-semibold">{packageInfo.deliveryAddress}</p>
                  </div>
                )}
              </div>

              {packageInfo.batch && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Hub Information</h3>
                  <p className="text-sm text-gray-600">Hub: {packageInfo.batch.hub.name}</p>
                  <p className="text-sm text-gray-600">Address: {packageInfo.batch.hub.address}</p>
                  <p className="text-sm text-gray-600">
                    Batch: {packageInfo.batch.batchNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Information */}
            {packageInfo.delivery && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Status</p>
                    <p className="text-lg font-semibold">
                      {getStatusText(packageInfo.delivery.status)}
                    </p>
                  </div>
                  {packageInfo.delivery.deliveredAt && (
                    <div>
                      <p className="text-sm text-gray-600">Delivered At</p>
                      <p className="text-lg font-semibold">
                        {formatDate(packageInfo.delivery.deliveredAt)}
                      </p>
                    </div>
                  )}
                </div>

                {packageInfo.delivery.proofOfDeliveryUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Proof of Delivery</p>
                    <img
                      src={packageInfo.delivery.proofOfDeliveryUrl}
                      alt="Proof of Delivery"
                      className="max-w-md rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {packageInfo.delivery.signatureUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Signature</p>
                    <img
                      src={packageInfo.delivery.signatureUrl}
                      alt="Signature"
                      className="max-w-md rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tracking History</h2>
              <div className="space-y-4">
                {packageInfo.eventLogs.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}
                      />
                      {index < packageInfo.eventLogs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-gray-900">
                        {event.eventType.replace(/_/g, ' ')}
                      </p>
                      {event.message && <p className="text-gray-600 text-sm">{event.message}</p>}
                      <p className="text-gray-500 text-xs mt-1">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            {defaultIcon &&
            ((packageInfo.deliveryLatitude && packageInfo.deliveryLongitude) ||
              (packageInfo.batch?.hub.latitude && packageInfo.batch?.hub.longitude)) ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[
                      Number(packageInfo.deliveryLatitude || packageInfo.batch?.hub.latitude),
                      Number(packageInfo.deliveryLongitude || packageInfo.batch?.hub.longitude),
                    ]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {packageInfo.deliveryLatitude && packageInfo.deliveryLongitude && (
                      <Marker
                        position={[
                          Number(packageInfo.deliveryLatitude),
                          Number(packageInfo.deliveryLongitude),
                        ]}
                        icon={defaultIcon}
                      >
                        <Popup>
                          <strong>Delivery Location</strong>
                          <br />
                          {packageInfo.deliveryAddress}
                        </Popup>
                      </Marker>
                    )}
                    {packageInfo.batch?.hub.latitude && packageInfo.batch?.hub.longitude && (
                      <Marker
                        position={[
                          Number(packageInfo.batch.hub.latitude),
                          Number(packageInfo.batch.hub.longitude),
                        ]}
                        icon={defaultIcon}
                      >
                        <Popup>
                          <strong>{packageInfo.batch.hub.name}</strong>
                          <br />
                          {packageInfo.batch.hub.address}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
