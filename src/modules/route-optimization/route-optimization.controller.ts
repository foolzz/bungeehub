import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RouteOptimizationService } from './route-optimization.service';
import { CalculateRouteDto } from './dto/calculate-route.dto';
import { RouteResponseDto } from './dto/route-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Route Optimization')
@Controller('api/v1/routes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RouteOptimizationController {
  constructor(
    private readonly routeOptimizationService: RouteOptimizationService,
  ) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate optimized delivery route',
    description:
      'Calculates the most efficient route for deliveries using OSRM. ' +
      'Optimizes waypoint order using Traveling Salesman Problem (TSP) algorithm. ' +
      'Falls back to nearest neighbor algorithm if OSRM is unavailable.',
  })
  @ApiResponse({
    status: 200,
    description: 'Route calculated successfully',
    type: RouteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async calculateRoute(
    @Body() calculateRouteDto: CalculateRouteDto,
  ): Promise<RouteResponseDto> {
    return this.routeOptimizationService.calculateRoute(calculateRouteDto);
  }
}
