'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { packagesApi, hubsApi, authApi } from '../../../lib/api';

// Dynamically import map components
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
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Optimize route using OSRM Trip API (solves Traveling Salesman Problem)
async function optimizeRouteWithOSRM(hub: any, packages: any[]): Promise<{
  route: any[];
  drivingRoutes: any[];
  totalDistance: number;
  totalDuration: number;
} | null> {
  if (packages.length === 0) return null;

  try {
    const DELIVERY_TIME_MINUTES = 4; // Average time per delivery stop

    // Build waypoints: hub as first/last, all packages in between
    const waypoints = [
      { lat: parseFloat(hub.latitude), lng: parseFloat(hub.longitude), isHub: true },
      ...packages.map(pkg => ({
        lat: parseFloat(pkg.deliveryLatitude),
        lng: parseFloat(pkg.deliveryLongitude),
        package: pkg,
      })),
    ];

    // Build coordinates string for OSRM Trip API: lng,lat;lng,lat;...
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');

    // OSRM Trip API - solves TSP and returns optimal route
    const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&destination=first&roundtrip=false&overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      console.error('OSRM Trip API error:', data);
      return null;
    }

    const trip = data.trips[0];

    // Get the optimized waypoint order from OSRM
    const waypointOrder = trip.waypoints.map((wp: any) => wp.waypoint_index);

    // Reorder packages based on OSRM's optimal route (skip first index which is the hub)
    const orderedPackages = waypointOrder.slice(1).map((idx: number) => packages[idx - 1]);

    // Extract individual legs (segments) from the trip
    const legs = trip.legs || [];
    const drivingRoutes: any[] = [];
    const route: any[] = [];

    let cumulativeTime = 0;

    // Process each leg and build the optimized route
    orderedPackages.forEach((pkg: any, index: number) => {
      const leg = legs[index];
      if (!leg) return;

      const segmentDistance = leg.distance / 1000; // meters to km
      const segmentDuration = leg.duration / 60; // seconds to minutes

      cumulativeTime += segmentDuration + DELIVERY_TIME_MINUTES;

      // Store route segment for display
      drivingRoutes.push({
        coordinates: leg.steps?.flatMap((step: any) =>
          step.geometry?.coordinates?.map((coord: number[]) => [coord[1], coord[0]]) || []
        ) || [],
        distance: segmentDistance,
        duration: segmentDuration,
        packageId: pkg.id,
      });

      // Add package to route with calculated metrics
      route.push({
        ...pkg,
        distance: segmentDistance,
        drivingTime: segmentDuration,
        deliveryTime: DELIVERY_TIME_MINUTES,
        cumulativeTime: cumulativeTime,
        estimatedArrival: new Date(Date.now() + cumulativeTime * 60 * 1000),
      });
    });

    const totalDistance = trip.distance / 1000; // meters to km
    const totalDuration = trip.duration / 60; // seconds to minutes
    const totalTimeWithStops = totalDuration + (orderedPackages.length * DELIVERY_TIME_MINUTES);

    return {
      route,
      drivingRoutes,
      totalDistance,
      totalDuration: totalTimeWithStops,
    };
  } catch (error) {
    console.error('Error optimizing route with OSRM:', error);
    return null;
  }
}

// Format time in hours and minutes
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default function RouteOptimizationPage() {
  const [hub, setHub] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hubId, setHubId] = useState<string>('');
  const [leaflet, setLeaflet] = useState<any>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [estimatedFinishTime, setEstimatedFinishTime] = useState<Date | null>(null);
  const [drivingRoutes, setDrivingRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      setLeaflet(L);
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (!id) {
        setError('No hub ID provided');
        setLoading(false);
        return;
      }

      setHubId(id);
      await fetchDataAndOptimize(id);
    };

    init();
  }, []);

  const fetchDataAndOptimize = async (id: string) => {
    try {
      setLoading(true);

      // Verify user owns this hub or is admin
      const profileResponse = await authApi.getProfile();
      const user = profileResponse.data;

      // Fetch hub details
      const hubResponse = await hubsApi.getById(id);
      const hubData = hubResponse.data;

      // Check permission
      if (user.id !== hubData.hostId && user.role !== 'ADMIN') {
        setError('You do not have permission to view routes for this hub');
        setLoading(false);
        return;
      }

      setHub(hubData);

      // Fetch packages that need delivery
      // Fetch all packages and filter client-side to avoid API parameter issues
      const packagesResponse = await packagesApi.getAll({ limit: 1000 });

      const allPackages = packagesResponse.data?.data || [];

      // Filter for this hub and deliverable statuses
      const pkgs = allPackages.filter(
        (pkg: any) =>
          pkg.assignedHub?.id === id &&
          (pkg.status === 'OUT_FOR_DELIVERY' || pkg.status === 'AT_HUB') &&
          pkg.deliveryLatitude &&
          pkg.deliveryLongitude
      );

      setPackages(pkgs);

      // Optimize route using OSRM Trip API (single API call, optimal TSP solution)
      if (pkgs.length > 0 && hubData.latitude && hubData.longitude) {
        setRoutesLoading(true);

        const result = await optimizeRouteWithOSRM(hubData, pkgs);

        if (result) {
          setOptimizedRoute(result.route);
          setDrivingRoutes(result.drivingRoutes);
          setTotalDistance(result.totalDistance);
          setTotalTime(result.totalDuration);
          setEstimatedFinishTime(new Date(Date.now() + result.totalDuration * 60 * 1000));
        } else {
          setError('Failed to optimize route. Please try again.');
        }

        setRoutesLoading(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Failed to load route data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Optimizing route...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <a
            href="/dashboard"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!hub || !leaflet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (optimizedRoute.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white shadow rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Deliveries to Optimize</h2>
            <p className="text-gray-600 mb-6">
              There are currently no packages ready for delivery at this hub.
              <br />
              (Looking for packages with status "OUT_FOR_DELIVERY" or "AT_HUB")
            </p>
            <a
              href={`/hubs/details?id=${hubId}`}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Back to Hub Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  const hubLat = parseFloat(hub.latitude);
  const hubLng = parseFloat(hub.longitude);
  const routeCoordinates = [
    [hubLat, hubLng],
    ...optimizedRoute.map(pkg => [parseFloat(pkg.deliveryLatitude), parseFloat(pkg.deliveryLongitude)])
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optimized Delivery Route</h1>
            <p className="text-gray-600 mt-1">{hub.name}</p>
          </div>
          <a
            href={`/hubs/details?id=${hubId}`}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Hub
          </a>
        </div>

        {/* Route Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Stops</h3>
            <p className="text-3xl font-bold text-primary-600">{optimizedRoute.length}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Distance</h3>
            <p className="text-3xl font-bold text-blue-600">{totalDistance.toFixed(2)} km</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Estimated Time</h3>
            <p className="text-3xl font-bold text-green-600">{formatTime(totalTime)}</p>
            <p className="text-xs text-gray-500 mt-1">Including delivery stops</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Est. Finish</h3>
            <p className="text-2xl font-bold text-purple-600">
              {estimatedFinishTime ? estimatedFinishTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Starting now</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <MapContainer
              center={[hubLat, hubLng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Hub Marker */}
              <Marker position={[hubLat, hubLng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">START: {hub.name}</h3>
                    <p className="text-xs">{hub.address}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Driving Route Lines */}
              {drivingRoutes.length > 0 ? (
                // Show actual driving routes
                drivingRoutes.map((route, index) => (
                  <Polyline
                    key={index}
                    positions={route.coordinates}
                    color="#2563eb"
                    weight={4}
                    opacity={0.7}
                  />
                ))
              ) : (
                // Fallback to straight lines if driving routes not loaded
                <Polyline positions={routeCoordinates as any} color="#3b82f6" weight={3} opacity={0.5} />
              )}

              {routesLoading && (
                <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded shadow-lg z-[1000]">
                  <p className="text-sm text-gray-600">Loading driving routes...</p>
                </div>
              )}

              {/* Package Markers */}
              {optimizedRoute.map((pkg, index) => {
                const lat = parseFloat(pkg.deliveryLatitude);
                const lng = parseFloat(pkg.deliveryLongitude);

                // Create numbered icon
                const icon = leaflet.divIcon({
                  html: `<div style="background-color: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                  className: '',
                  iconSize: [30, 30],
                  iconAnchor: [15, 15],
                });

                return (
                  <Marker key={pkg.id} position={[lat, lng]} icon={icon}>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold">Stop #{index + 1}</h3>
                        <p className="text-sm">{pkg.trackingNumber}</p>
                        <p className="text-sm">{pkg.recipientName}</p>
                        <p className="text-xs text-gray-600">{pkg.deliveryAddress}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {pkg.distance?.toFixed(2)} km from previous ({formatTime(pkg.drivingTime)})
                        </p>
                        <p className="text-xs text-purple-600">
                          Est. arrival: {pkg.estimatedArrival?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Route List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Delivery Sequence</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '536px' }}>
              {optimizedRoute.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className="px-6 py-4 border-b hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{pkg.recipientName}</div>
                      <div className="text-sm text-gray-600 truncate">{pkg.deliveryAddress}</div>
                      <div className="text-xs text-gray-500 mt-1">{pkg.trackingNumber}</div>
                      {pkg.specialInstructions && (
                        <div className="text-xs text-blue-600 mt-1">
                          📝 {pkg.specialInstructions}
                        </div>
                      )}
                      <div className="flex gap-3 mt-2">
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          🚗 {pkg.distance?.toFixed(2)} km ({formatTime(pkg.drivingTime)})
                        </div>
                        <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                          ⏱ {formatTime(pkg.deliveryTime)} delivery
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Est. arrival: {pkg.estimatedArrival?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Route Optimization:</strong> This route is optimized using OpenStreetMap Routing Machine (OSRM) Trip API,
            which solves the Traveling Salesman Problem to find the most efficient delivery order.
            The algorithm calculates the optimal sequence to minimize total driving distance and time.
            <br /><strong>Real Driving Routes:</strong> All routes use actual road networks with turn-by-turn directions,
            providing accurate distances and time estimates including 4 minutes per delivery stop.
          </p>
        </div>
      </div>
    </div>
  );
}
