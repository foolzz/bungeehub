import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class WaypointDto {
  @ApiProperty({
    description: 'Latitude of the waypoint',
    example: 37.7749,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude of the waypoint',
    example: -122.4194,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Package ID or identifier',
    example: 'pkg-123',
    required: false,
  })
  @IsOptional()
  id?: string;
}

export class CalculateRouteDto {
  @ApiProperty({
    description: 'Starting point (hub) latitude',
    example: 37.7749,
  })
  @IsNumber()
  startLatitude: number;

  @ApiProperty({
    description: 'Starting point (hub) longitude',
    example: -122.4194,
  })
  @IsNumber()
  startLongitude: number;

  @ApiProperty({
    description: 'Array of delivery waypoints',
    type: [WaypointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints: WaypointDto[];

  @ApiProperty({
    description: 'Whether to return to start point (round trip)',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  roundTrip?: boolean;

  @ApiProperty({
    description: 'Whether to optimize the waypoint order',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  optimize?: boolean;
}
