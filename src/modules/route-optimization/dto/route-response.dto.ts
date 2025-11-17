import { ApiProperty } from '@nestjs/swagger';

export class RouteWaypointDto {
  @ApiProperty({ description: 'Waypoint order in optimized route' })
  order: number;

  @ApiProperty({ description: 'Original waypoint ID' })
  id?: string;

  @ApiProperty({ description: 'Latitude' })
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  longitude: number;

  @ApiProperty({ description: 'Distance from previous waypoint (meters)' })
  distanceFromPrevious: number;

  @ApiProperty({ description: 'Duration from previous waypoint (seconds)' })
  durationFromPrevious: number;

  @ApiProperty({ description: 'Cumulative distance from start (meters)' })
  cumulativeDistance: number;

  @ApiProperty({ description: 'Cumulative duration from start (seconds)' })
  cumulativeDuration: number;
}

export class RouteResponseDto {
  @ApiProperty({ description: 'Total route distance in meters' })
  totalDistance: number;

  @ApiProperty({ description: 'Total route duration in seconds' })
  totalDuration: number;

  @ApiProperty({ description: 'Optimized waypoints in order', type: [RouteWaypointDto] })
  waypoints: RouteWaypointDto[];

  @ApiProperty({ description: 'Route geometry (encoded polyline)', required: false })
  geometry?: string;

  @ApiProperty({ description: 'Whether the route was optimized' })
  optimized: boolean;

  @ApiProperty({ description: 'Whether the route is a round trip' })
  roundTrip: boolean;
}
