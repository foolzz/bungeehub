import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { QueryHubDto } from './dto/query-hub.dto';
import { HubStatus, HubTier, UserRole } from '@prisma/client';

@Injectable()
export class HubsService {
  private readonly logger = new Logger(HubsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createHubDto: CreateHubDto, userId: string) {
    // Verify user is a hub host
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.HUB_HOST && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only hub hosts can create hubs');
    }

    // Create the hub
    const hub = await this.prisma.hub.create({
      data: {
        hostId: userId,
        name: createHubDto.name,
        address: createHubDto.address,
        latitude: createHubDto.latitude,
        longitude: createHubDto.longitude,
        capacity: createHubDto.capacity || 100,
        status: HubStatus.PENDING, // All new hubs start as PENDING
        tier: HubTier.NEW_HUB, // All new hubs start as NEW_HUB
        rating: 0,
        totalDeliveries: 0,
      },
      include: {
        host: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    this.logger.log(`Hub created: ${hub.name} (ID: ${hub.id}) by user ${user.email}`);

    return hub;
  }

  async findAll(queryDto: QueryHubDto) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.tier) {
      where.tier = queryDto.tier;
    }

    if (queryDto.minRating !== undefined) {
      where.rating = {
        gte: queryDto.minRating,
      };
    }

    const [hubs, total] = await Promise.all([
      this.prisma.hub.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rating: 'desc' }, { totalDeliveries: 'desc' }, { createdAt: 'desc' }],
        include: {
          host: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
          _count: {
            select: {
              packages: true,
              deliveries: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.hub.count({ where }),
    ]);

    return {
      data: hubs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const hub = await this.prisma.hub.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            packages: true,
            deliveries: true,
            reviews: true,
          },
        },
      },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    return hub;
  }

  async findByHostId(hostId: string, queryDto: QueryHubDto) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { hostId };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.tier) {
      where.tier = queryDto.tier;
    }

    const [hubs, total] = await Promise.all([
      this.prisma.hub.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              packages: true,
              deliveries: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.hub.count({ where }),
    ]);

    return {
      data: hubs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateHubDto: UpdateHubDto, userId: string, userRole: UserRole) {
    const hub = await this.prisma.hub.findUnique({
      where: { id },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    // Check authorization
    if (userRole !== UserRole.ADMIN && hub.hostId !== userId) {
      throw new ForbiddenException('You can only update your own hubs');
    }

    // Only admins can change status
    if (updateHubDto.status && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change hub status');
    }

    const updatedHub = await this.prisma.hub.update({
      where: { id },
      data: {
        name: updateHubDto.name,
        address: updateHubDto.address,
        latitude: updateHubDto.latitude,
        longitude: updateHubDto.longitude,
        capacity: updateHubDto.capacity,
        status: updateHubDto.status,
      },
      include: {
        host: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    this.logger.log(`Hub updated: ${updatedHub.name} (ID: ${id})`);

    return updatedHub;
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const hub = await this.prisma.hub.findUnique({
      where: { id },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    // Check authorization
    if (userRole !== UserRole.ADMIN && hub.hostId !== userId) {
      throw new ForbiddenException('You can only delete your own hubs');
    }

    // Check if hub has active packages
    const activePackages = await this.prisma.package.count({
      where: {
        assignedHubId: id,
        status: {
          in: ['AT_HUB', 'OUT_FOR_DELIVERY'],
        },
      },
    });

    if (activePackages > 0) {
      throw new BadRequestException(
        `Cannot delete hub with ${activePackages} active package(s). Please reassign or complete deliveries first.`,
      );
    }

    // Soft delete by setting status to INACTIVE
    const deletedHub = await this.prisma.hub.update({
      where: { id },
      data: {
        status: HubStatus.INACTIVE,
      },
    });

    this.logger.log(`Hub deactivated: ${deletedHub.name} (ID: ${id})`);

    return { message: 'Hub successfully deactivated', hub: deletedHub };
  }

  async getMetrics(id: string, days: number = 30) {
    const hub = await this.prisma.hub.findUnique({
      where: { id },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.prisma.hubMetric.findMany({
      where: {
        hubId: id,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate aggregate metrics
    const totalPackagesReceived = metrics.reduce((sum, m) => sum + m.packagesReceived, 0);
    const totalPackagesDelivered = metrics.reduce((sum, m) => sum + m.packagesDelivered, 0);
    const totalPackagesFailed = metrics.reduce((sum, m) => sum + m.packagesFailed, 0);
    const avgDeliveryTime =
      metrics.reduce((sum, m) => sum + (m.avgDeliveryTime || 0), 0) / (metrics.length || 1);
    const avgCustomerRating =
      metrics.reduce((sum, m) => sum + (m.customerRating ? Number(m.customerRating) : 0), 0) /
      (metrics.length || 1);

    return {
      hub: {
        id: hub.id,
        name: hub.name,
        tier: hub.tier,
        rating: hub.rating,
      },
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      aggregates: {
        totalPackagesReceived,
        totalPackagesDelivered,
        totalPackagesFailed,
        deliverySuccessRate:
          totalPackagesReceived > 0
            ? ((totalPackagesDelivered / totalPackagesReceived) * 100).toFixed(2)
            : '0.00',
        avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
        avgCustomerRating: avgCustomerRating.toFixed(2),
      },
      dailyMetrics: metrics,
    };
  }

  async getReviews(id: string, page: number = 1, limit: number = 20) {
    const hub = await this.prisma.hub.findUnique({
      where: { id },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.hubReview.findMany({
        where: { hubId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.hubReview.count({ where: { hubId: id } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
