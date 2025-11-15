/**
 * Mock Data Generator
 * Generates 20-30 nearby packages for testing route calculation
 */

import { MockPackage, OptimizedRoute, RouteWaypoint } from '../types';

// Helper function to generate random coordinates near a hub location
function generateNearbyCoordinates(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { latitude: number; longitude: number } {
  // Convert radius from km to degrees (rough approximation)
  const radiusDegrees = radiusKm / 111; // 1 degree ≈ 111 km

  // Generate random angle
  const angle = Math.random() * 2 * Math.PI;

  // Generate random radius (with square root for uniform distribution)
  const r = Math.sqrt(Math.random()) * radiusDegrees;

  // Calculate offset
  const latOffset = r * Math.cos(angle);
  const lngOffset = r * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);

  return {
    latitude: centerLat + latOffset,
    longitude: centerLng + lngOffset,
  };
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Street names for realistic addresses
const STREET_NAMES = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Pine Rd', 'Cedar Ln',
  'Elm St', 'Washington Blvd', 'Park Ave', 'Broadway', 'Market St',
  'First St', 'Second Ave', 'Third Dr', 'Fourth Pl', 'Fifth Way',
  'Sunset Blvd', 'Ocean View Dr', 'Hill St', 'Valley Rd', 'Mountain Ave',
  'River Rd', 'Lake Dr', 'Forest Ln', 'Meadow Way', 'Garden St',
];

const FIRST_NAMES = [
  'John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava',
  'Robert', 'Isabella', 'David', 'Mia', 'Richard', 'Charlotte', 'Joseph',
  'Amelia', 'Thomas', 'Harper', 'Charles', 'Evelyn', 'Daniel', 'Abigail',
  'Matthew', 'Emily', 'Anthony', 'Elizabeth', 'Mark', 'Sofia', 'Paul', 'Ella',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Hall',
];

/**
 * Generate mock packages near a hub location
 * @param hubLat Hub latitude
 * @param hubLng Hub longitude
 * @param count Number of packages to generate (default: 25)
 * @param radiusKm Maximum distance from hub in km (default: 10)
 * @returns Array of mock packages
 */
export function generateMockPackages(
  hubLat: number,
  hubLng: number,
  count: number = 25,
  radiusKm: number = 10
): MockPackage[] {
  const packages: MockPackage[] = [];

  for (let i = 0; i < count; i++) {
    const coords = generateNearbyCoordinates(hubLat, hubLng, radiusKm);
    const streetNumber = Math.floor(Math.random() * 9999) + 1;
    const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

    const pkg: MockPackage = {
      id: `mock-pkg-${i + 1}`,
      trackingNumber: `MOCK-TRK-${String(i + 1).padStart(5, '0')}`,
      barcode: `MOCK-BAR-${String(i + 1).padStart(8, '0')}`,
      recipientName: `${firstName} ${lastName}`,
      deliveryAddress: `${streetNumber} ${streetName}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      distance: calculateDistance(hubLat, hubLng, coords.latitude, coords.longitude),
    };

    packages.push(pkg);
  }

  return packages;
}

/**
 * Nearest Neighbor Algorithm for route optimization
 * Simple but effective for small sets of deliveries
 */
export function optimizeRouteNearestNeighbor(
  hubLat: number,
  hubLng: number,
  packages: MockPackage[]
): OptimizedRoute {
  if (packages.length === 0) {
    return {
      waypoints: [],
      totalDistance: 0,
      estimatedDuration: 0,
    };
  }

  const unvisited = [...packages];
  const waypoints: RouteWaypoint[] = [];
  let currentLat = hubLat;
  let currentLng = hubLng;
  let totalDistance = 0;

  // Start from hub, find nearest package, then find nearest to that, etc.
  while (unvisited.length > 0) {
    // Find nearest package to current location
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(
      currentLat,
      currentLng,
      unvisited[0].latitude,
      unvisited[0].longitude
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // Add to route
    const nearest = unvisited.splice(nearestIndex, 1)[0];
    waypoints.push({
      package: nearest,
      order: waypoints.length + 1,
    });

    totalDistance += nearestDistance;
    currentLat = nearest.latitude;
    currentLng = nearest.longitude;
  }

  // Return to hub
  const returnDistance = calculateDistance(
    currentLat,
    currentLng,
    hubLat,
    hubLng
  );
  totalDistance += returnDistance;

  // Estimate duration: assume average speed of 30 km/h in city
  // Plus 3 minutes per delivery
  const drivingMinutes = (totalDistance / 30) * 60;
  const deliveryMinutes = waypoints.length * 3;
  const estimatedDuration = Math.ceil(drivingMinutes + deliveryMinutes);

  // Calculate estimated arrival times
  let cumulativeMinutes = 0;
  const now = new Date();
  waypoints.forEach((waypoint, index) => {
    if (index === 0) {
      const distanceFromHub = calculateDistance(
        hubLat,
        hubLng,
        waypoint.package.latitude,
        waypoint.package.longitude
      );
      cumulativeMinutes = (distanceFromHub / 30) * 60 + 3;
    } else {
      const distanceFromPrev = calculateDistance(
        waypoints[index - 1].package.latitude,
        waypoints[index - 1].package.longitude,
        waypoint.package.latitude,
        waypoint.package.longitude
      );
      cumulativeMinutes += (distanceFromPrev / 30) * 60 + 3;
    }
    waypoint.estimatedArrival = new Date(now.getTime() + cumulativeMinutes * 60000);
  });

  return {
    waypoints,
    totalDistance,
    estimatedDuration,
  };
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}
