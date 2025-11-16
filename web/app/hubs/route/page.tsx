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

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Nearest neighbor algorithm for route optimization with time estimates
function optimizeRoute(hub: any, packages: any[]): any[] {
  if (packages.length === 0) return [];

  const unvisited = [...packages];
  const route = [];
  let currentLat = parseFloat(hub.latitude);
  let currentLng = parseFloat(hub.longitude);
  let cumulativeTime = 0; // in minutes

  const AVERAGE_SPEED_KMH = 35; // Urban driving speed
  const DELIVERY_TIME_MINUTES = 4; // Average time per delivery stop

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    // Find nearest unvisited package
    unvisited.forEach((pkg, index) => {
      const pkgLat = parseFloat(pkg.deliveryLatitude);
      const pkgLng = parseFloat(pkg.deliveryLongitude);
      const distance = calculateDistance(currentLat, currentLng, pkgLat, pkgLng);

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    // Calculate time for this segment
    const drivingTimeMinutes = (minDistance / AVERAGE_SPEED_KMH) * 60;
    cumulativeTime += drivingTimeMinutes + DELIVERY_TIME_MINUTES;

    // Add nearest to route and remove from unvisited
    const nearest = unvisited.splice(nearestIndex, 1)[0];
    route.push({
      ...nearest,
      distance: minDistance,
      drivingTime: drivingTimeMinutes,
      deliveryTime: DELIVERY_TIME_MINUTES,
      cumulativeTime: cumulativeTime,
      estimatedArrival: new Date(Date.now() + cumulativeTime * 60 * 1000),
    });
    currentLat = parseFloat(nearest.deliveryLatitude);
    currentLng = parseFloat(nearest.deliveryLongitude);
  }

  return route;
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

  // Fetch actual driving route from OSRM (OpenStreetMap Routing Machine)
  const fetchDrivingRoute = async (waypoints: Array<{lat: number, lng: number}>) => {
    try {
      // Build coordinates string for OSRM: lng,lat;lng,lat;...
      const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');

      // OSRM API endpoint (free public instance)
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
          distance: route.distance / 1000, // meters to km
          duration: route.duration / 60, // seconds to minutes
          steps: route.legs || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching driving route:', error);
      return null;
    }
  };

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
      const packagesResponse = await packagesApi.getAll({
        assignedHubId: id,
        status: 'OUT_FOR_DELIVERY',
        limit: 100,
      });

      const pkgs = (packagesResponse.data?.data || []).filter(
        (pkg: any) => pkg.deliveryLatitude && pkg.deliveryLongitude
      );

      setPackages(pkgs);

      // Optimize route
      if (pkgs.length > 0 && hubData.latitude && hubData.longitude) {
        const route = optimizeRoute(hubData, pkgs);
        setOptimizedRoute(route);

        // Calculate total distance and time
        const totalDist = route.reduce((sum, pkg) => sum + (pkg.distance || 0), 0);
        const totalTimeMin = route.length > 0 ? route[route.length - 1].cumulativeTime : 0;

        setTotalDistance(totalDist);
        setTotalTime(totalTimeMin);
        setEstimatedFinishTime(route.length > 0 ? route[route.length - 1].estimatedArrival : null);

        // Fetch actual driving routes for each segment
        setRoutesLoading(true);
        const routes = [];

        // Start from hub
        let prevPoint = {
          lat: parseFloat(hubData.latitude),
          lng: parseFloat(hubData.longitude)
        };

        for (const pkg of route) {
          const currentPoint = {
            lat: parseFloat(pkg.deliveryLatitude),
            lng: parseFloat(pkg.deliveryLongitude)
          };

          const drivingRoute = await fetchDrivingRoute([prevPoint, currentPoint]);
          if (drivingRoute) {
            routes.push({
              ...drivingRoute,
              packageId: pkg.id,
              from: prevPoint,
              to: currentPoint
            });
          }

          prevPoint = currentPoint;
        }

        setDrivingRoutes(routes);
        setRoutesLoading(false);

        // Update with actual driving distances and times
        if (routes.length > 0) {
          const actualTotalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
          const actualTotalDuration = routes.reduce((sum, r) => sum + r.duration, 0);
          const deliveryTime = route.length * 4; // 4 minutes per stop

          setTotalDistance(actualTotalDistance);
          setTotalTime(actualTotalDuration + deliveryTime);
          setEstimatedFinishTime(new Date(Date.now() + (actualTotalDuration + deliveryTime) * 60 * 1000));

          // Update route with actual distances
          const updatedRoute = route.map((pkg, index) => ({
            ...pkg,
            distance: routes[index]?.distance || pkg.distance,
            drivingTime: routes[index]?.duration || pkg.drivingTime,
            cumulativeTime: routes.slice(0, index + 1).reduce((sum, r) => sum + r.duration, 0) + (index + 1) * 4,
            estimatedArrival: new Date(Date.now() + (routes.slice(0, index + 1).reduce((sum, r) => sum + r.duration, 0) + (index + 1) * 4) * 60 * 1000)
          }));
          setOptimizedRoute(updatedRoute);
        }
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
              There are no packages marked as "OUT FOR DELIVERY" for this hub.
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
            <strong>Route Optimization:</strong> This route is optimized using the nearest-neighbor algorithm.
            Starting from your hub, each delivery stop is chosen as the nearest unvisited package location.
            {drivingRoutes.length > 0 ? (
              <><br /><strong>Driving Routes:</strong> Actual driving routes are fetched from OpenStreetMap Routing Machine (OSRM), showing real road paths instead of straight lines. Distances and times are calculated based on actual road networks.</>
            ) : (
              <><br /><strong>Note:</strong> Routes are shown as straight lines. Actual driving distances and times assume an average urban speed of 35 km/h plus 4 minutes per delivery stop.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
