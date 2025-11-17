import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CalculateRouteDto, WaypointDto } from './dto/calculate-route.dto';
import { RouteResponseDto, RouteWaypointDto } from './dto/route-response.dto';

interface OSRMTripResponse {
  code: string;
  trips: Array<{
    distance: number;
    duration: number;
    geometry: string;
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
  waypoints: Array<{
    waypoint_index: number;
    trips_index: number;
    distance: number;
    location: [number, number];
  }>;
}

@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);
  private readonly osrmBaseUrl: string;

  constructor() {
    // Use environment variable or default to public OSRM demo server
    // IMPORTANT: In production, self-host OSRM for reliability and performance
    this.osrmBaseUrl =
      process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
  }

  /**
   * Calculate optimized route for deliveries
   */
  async calculateRoute(
    calculateRouteDto: CalculateRouteDto,
  ): Promise<RouteResponseDto> {
    const { startLatitude, startLongitude, waypoints, roundTrip = true, optimize = true } =
      calculateRouteDto;

    if (waypoints.length === 0) {
      throw new BadRequestException('At least one waypoint is required');
    }

    if (waypoints.length > 100) {
      throw new BadRequestException('Maximum 100 waypoints allowed');
    }

    // Try OSRM optimization first, fallback to nearest neighbor if it fails
    try {
      if (optimize && waypoints.length > 1) {
        return await this.optimizeWithOSRM(
          startLatitude,
          startLongitude,
          waypoints,
          roundTrip,
        );
      } else {
        return await this.calculateUnoptimizedRoute(
          startLatitude,
          startLongitude,
          waypoints,
          roundTrip,
        );
      }
    } catch (error) {
      this.logger.warn(
        `OSRM optimization failed, falling back to nearest neighbor: ${error.message}`,
      );
      return await this.optimizeWithNearestNeighbor(
        startLatitude,
        startLongitude,
        waypoints,
        roundTrip,
      );
    }
  }

  /**
   * Use OSRM's trip optimization endpoint
   */
  private async optimizeWithOSRM(
    startLat: number,
    startLng: number,
    waypoints: WaypointDto[],
    roundTrip: boolean,
  ): Promise<RouteResponseDto> {
    // Build coordinates string: start + waypoints (+ start if roundtrip)
    const coordinates: Array<[number, number]> = [
      [startLng, startLat], // OSRM uses [lng, lat] format
      ...waypoints.map((wp) => [wp.longitude, wp.latitude] as [number, number]),
    ];

    if (roundTrip) {
      coordinates.push([startLng, startLat]);
    }

    const coordinatesStr = coordinates.map((c) => c.join(',')).join(';');

    // OSRM Trip endpoint for TSP optimization
    const url = `${this.osrmBaseUrl}/trip/v1/driving/${coordinatesStr}?source=first&destination=${roundTrip ? 'first' : 'last'}&roundtrip=${roundTrip}&geometries=polyline`;

    this.logger.log(`Calling OSRM: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'BungeeHub/1.0' },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `OSRM API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: OSRMTripResponse = await response.json();

    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      throw new Error(`OSRM returned no valid trip: ${data.code}`);
    }

    const trip = data.trips[0];
    const orderedWaypoints: RouteWaypointDto[] = [];

    let cumulativeDistance = 0;
    let cumulativeDuration = 0;

    // Map OSRM waypoints to our format
    // Skip first (start) and last (return to start if roundtrip)
    const relevantWaypoints = data.waypoints.slice(
      1,
      roundTrip ? -1 : data.waypoints.length,
    );

    relevantWaypoints.forEach((osrmWaypoint, index) => {
      const leg = trip.legs[index];
      cumulativeDistance += leg.distance;
      cumulativeDuration += leg.duration;

      // Find original waypoint by matching coordinates
      const originalWaypoint = waypoints.find(
        (wp) =>
          Math.abs(wp.latitude - osrmWaypoint.location[1]) < 0.0001 &&
          Math.abs(wp.longitude - osrmWaypoint.location[0]) < 0.0001,
      );

      orderedWaypoints.push({
        order: index + 1,
        id: originalWaypoint?.id,
        latitude: osrmWaypoint.location[1],
        longitude: osrmWaypoint.location[0],
        distanceFromPrevious: leg.distance,
        durationFromPrevious: leg.duration,
        cumulativeDistance,
        cumulativeDuration,
      });
    });

    this.logger.log(
      `OSRM optimized route: ${orderedWaypoints.length} waypoints, ${(trip.distance / 1000).toFixed(2)}km, ${(trip.duration / 60).toFixed(0)}min`,
    );

    return {
      totalDistance: trip.distance,
      totalDuration: trip.duration,
      waypoints: orderedWaypoints,
      geometry: trip.geometry,
      optimized: true,
      roundTrip,
    };
  }

  /**
   * Calculate route without optimization (waypoints in given order)
   */
  private async calculateUnoptimizedRoute(
    startLat: number,
    startLng: number,
    waypoints: WaypointDto[],
    roundTrip: boolean,
  ): Promise<RouteResponseDto> {
    const coordinates: Array<[number, number]> = [
      [startLng, startLat],
      ...waypoints.map((wp) => [wp.longitude, wp.latitude] as [number, number]),
    ];

    if (roundTrip) {
      coordinates.push([startLng, startLat]);
    }

    const coordinatesStr = coordinates.map((c) => c.join(',')).join(';');

    // OSRM Route endpoint for unoptimized route
    const url = `${this.osrmBaseUrl}/route/v1/driving/${coordinatesStr}?overview=full&geometries=polyline`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'BungeeHub/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `OSRM API error: ${response.status} ${response.statusText}`,
      );
    }

    const data: any = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM returned no valid route: ${data.code}`);
    }

    const route = data.routes[0];
    const orderedWaypoints: RouteWaypointDto[] = [];

    let cumulativeDistance = 0;
    let cumulativeDuration = 0;

    waypoints.forEach((waypoint, index) => {
      const leg = route.legs[index];
      cumulativeDistance += leg.distance;
      cumulativeDuration += leg.duration;

      orderedWaypoints.push({
        order: index + 1,
        id: waypoint.id,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        distanceFromPrevious: leg.distance,
        durationFromPrevious: leg.duration,
        cumulativeDistance,
        cumulativeDuration,
      });
    });

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      waypoints: orderedWaypoints,
      geometry: route.geometry,
      optimized: false,
      roundTrip,
    };
  }

  /**
   * Fallback: Nearest neighbor algorithm for route optimization
   */
  private async optimizeWithNearestNeighbor(
    startLat: number,
    startLng: number,
    waypoints: WaypointDto[],
    roundTrip: boolean,
  ): Promise<RouteResponseDto> {
    this.logger.log('Using nearest neighbor fallback algorithm');

    const unvisited = [...waypoints];
    const ordered: WaypointDto[] = [];
    let currentLat = startLat;
    let currentLng = startLng;

    // Greedy nearest neighbor selection
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        currentLat,
        currentLng,
        unvisited[0].latitude,
        unvisited[0].longitude,
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          currentLat,
          currentLng,
          unvisited[i].latitude,
          unvisited[i].longitude,
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      ordered.push(nearest);
      currentLat = nearest.latitude;
      currentLng = nearest.longitude;
    }

    // Calculate route metrics
    const orderedWaypoints: RouteWaypointDto[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let prevLat = startLat;
    let prevLng = startLng;

    ordered.forEach((waypoint, index) => {
      const distance = this.calculateDistance(
        prevLat,
        prevLng,
        waypoint.latitude,
        waypoint.longitude,
      );

      // Estimate duration: average speed 40 km/h in city
      const duration = (distance / 40000) * 3600;

      totalDistance += distance;
      totalDuration += duration;

      orderedWaypoints.push({
        order: index + 1,
        id: waypoint.id,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        distanceFromPrevious: distance,
        durationFromPrevious: duration,
        cumulativeDistance: totalDistance,
        cumulativeDuration: totalDuration,
      });

      prevLat = waypoint.latitude;
      prevLng = waypoint.longitude;
    });

    // Add return trip if needed
    if (roundTrip) {
      const returnDistance = this.calculateDistance(
        prevLat,
        prevLng,
        startLat,
        startLng,
      );
      const returnDuration = (returnDistance / 40000) * 3600;
      totalDistance += returnDistance;
      totalDuration += returnDuration;
    }

    this.logger.log(
      `Nearest neighbor route: ${orderedWaypoints.length} waypoints, ${(totalDistance / 1000).toFixed(2)}km (estimated)`,
    );

    return {
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
      waypoints: orderedWaypoints,
      optimized: true,
      roundTrip,
    };
  }

  /**
   * Calculate straight-line distance between two points (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
