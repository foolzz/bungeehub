'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { packagesApi, hubsApi } from '../../../lib/api';

// Dynamically import map components to avoid SSR issues
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
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

export default function PackagesMapPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedHub, setSelectedHub] = useState('');
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      setLeaflet(L);
      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagesResponse, hubsResponse] = await Promise.all([
        packagesApi.getAll({ limit: 1000 }),
        hubsApi.getAll(),
      ]);

      const packagesData = packagesResponse.data?.data || [];
      const hubsData = hubsResponse.data?.data || [];

      // Filter packages with valid coordinates
      const validPackages = packagesData.filter(
        (pkg: any) => pkg.deliveryLatitude && pkg.deliveryLongitude
      );

      setPackages(validPackages);
      setHubs(hubsData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: '#FCD34D',
      IN_TRANSIT: '#60A5FA',
      AT_HUB: '#A78BFA',
      OUT_FOR_DELIVERY: '#818CF8',
      DELIVERED: '#34D399',
      FAILED: '#F87171',
      RETURNED: '#9CA3AF',
    };
    return colors[status] || '#9CA3AF';
  };

  const filteredPackages = packages.filter((pkg) => {
    if (selectedStatus && pkg.status !== selectedStatus) return false;
    if (selectedHub && pkg.assignedHubId !== selectedHub) return false;
    return true;
  });

  // Calculate map center from hubs or default to Richmond Hill, ON
  const mapCenter: [number, number] = hubs.length > 0 && hubs[0].latitude && hubs[0].longitude
    ? [parseFloat(hubs[0].latitude), parseFloat(hubs[0].longitude)]
    : [43.8828, -79.4403]; // Richmond Hill, ON default

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading map...</div>
      </div>
    );
  }

  if (!leaflet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Initializing map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Packages Map View</h1>
            <div className="flex gap-2">
              <a
                href="/packages"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                List View
              </a>
              <a
                href="/dashboard"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="AT_HUB">At Hub</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Hub
              </label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">All Hubs</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredPackages.length} of {packages.length} packages
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="font-medium text-gray-700">Status Legend:</div>
            {['PENDING', 'IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="text-gray-600">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Hub Markers */}
            {hubs.map((hub) => {
              if (!hub.latitude || !hub.longitude) return null;
              const lat = parseFloat(hub.latitude);
              const lng = parseFloat(hub.longitude);

              return (
                <Marker key={`hub-${hub.id}`} position={[lat, lng]}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">{hub.name}</h3>
                      <p className="text-sm text-gray-600">{hub.address}</p>
                      <p className="text-sm mt-1">
                        <strong>Status:</strong> {hub.status}
                      </p>
                      <p className="text-sm">
                        <strong>Rating:</strong> ★ {hub.rating || '0.0'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Package Markers */}
            {filteredPackages.map((pkg) => {
              const lat = parseFloat(pkg.deliveryLatitude);
              const lng = parseFloat(pkg.deliveryLongitude);
              const color = getStatusColor(pkg.status);

              return (
                <CircleMarker
                  key={pkg.id}
                  center={[lat, lng]}
                  radius={6}
                  fillColor={color}
                  fillOpacity={0.7}
                  color="#fff"
                  weight={2}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{pkg.trackingNumber}</h3>
                      <p className="text-sm mt-1">
                        <strong>Status:</strong>{' '}
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: color, color: '#fff' }}
                        >
                          {pkg.status.replace('_', ' ')}
                        </span>
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Recipient:</strong> {pkg.recipientName || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Address:</strong> {pkg.deliveryAddress}
                      </p>
                      <p className="text-sm">
                        <strong>Hub:</strong> {pkg.assignedHub?.name || pkg.hub?.name || 'N/A'}
                      </p>
                      {pkg.senderName && (
                        <p className="text-sm">
                          <strong>Sender:</strong> {pkg.senderName}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
