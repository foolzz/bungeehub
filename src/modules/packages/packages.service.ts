import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { PackageStatus, BatchStatus, HubStatus } from '@prisma/client';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== Package Operations ====================

  async createPackage(createPackageDto: CreatePackageDto) {
    // Check if tracking number or barcode already exists
    const existingPackage = await this.prisma.package.findFirst({
      where: {
        OR: [
          { trackingNumber: createPackageDto.trackingNumber },
          { barcode: createPackageDto.barcode },
        ],
      },
    });

    if (existingPackage) {
      throw new ConflictException('Package with this tracking number or barcode already exists');
    }

    // Validate hub if provided
    if (createPackageDto.assignedHubId) {
      const hub = await this.prisma.hub.findUnique({
        where: { id: createPackageDto.assignedHubId },
      });

      if (!hub) {
        throw new NotFoundException('Assigned hub not found');
      }

      if (hub.status !== HubStatus.ACTIVE) {
        throw new BadRequestException('Cannot assign package to inactive hub');
      }
    }

    // Validate batch if provided
    if (createPackageDto.batchId) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: createPackageDto.batchId },
      });

      if (!batch) {
        throw new NotFoundException('Batch not found');
      }
    }

    const packageData = await this.prisma.package.create({
      data: {
        trackingNumber: createPackageDto.trackingNumber,
        barcode: createPackageDto.barcode,
        assignedHubId: createPackageDto.assignedHubId,
        batchId: createPackageDto.batchId,
        recipientName: createPackageDto.recipientName,
        recipientPhone: createPackageDto.recipientPhone,
        deliveryAddress: createPackageDto.deliveryAddress,
        weight: createPackageDto.weight,
        dimensions: createPackageDto.dimensions,
        notes: createPackageDto.notes,
        status: PackageStatus.PENDING,
      },
      include: {
        assignedHub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Package created: ${packageData.trackingNumber} (ID: ${packageData.id})`);

    return packageData;
  }

  async findAllPackages(queryDto: QueryPackageDto) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.hubId) {
      where.assignedHubId = queryDto.hubId;
    }

    if (queryDto.batchId) {
      where.batchId = queryDto.batchId;
    }

    const [packages, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedHub: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          batch: {
            select: {
              id: true,
              batchNumber: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.package.count({ where }),
    ]);

    return {
      data: packages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPackageById(id: string) {
    const packageData = await this.prisma.package.findUnique({
      where: { id },
      include: {
        assignedHub: {
          select: {
            id: true,
            name: true,
            address: true,
            host: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
            expectedDeliveryDate: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            proofOfDeliveryUrl: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    return packageData;
  }

  async findPackageByTrackingNumber(trackingNumber: string) {
    const packageData = await this.prisma.package.findUnique({
      where: { trackingNumber },
      include: {
        assignedHub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            proofOfDeliveryUrl: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    return packageData;
  }

  async findPackageByBarcode(barcode: string) {
    const packageData = await this.prisma.package.findUnique({
      where: { barcode },
      include: {
        assignedHub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        batch: true,
        delivery: true,
      },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    return packageData;
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto) {
    const existingPackage = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      throw new NotFoundException('Package not found');
    }

    // Validate hub if being updated
    if (updatePackageDto.assignedHubId) {
      const hub = await this.prisma.hub.findUnique({
        where: { id: updatePackageDto.assignedHubId },
      });

      if (!hub) {
        throw new NotFoundException('Assigned hub not found');
      }

      if (hub.status !== HubStatus.ACTIVE) {
        throw new BadRequestException('Cannot assign package to inactive hub');
      }
    }

    // Validate batch if being updated
    if (updatePackageDto.batchId) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: updatePackageDto.batchId },
      });

      if (!batch) {
        throw new NotFoundException('Batch not found');
      }
    }

    const updatedPackage = await this.prisma.package.update({
      where: { id },
      data: {
        status: updatePackageDto.status,
        assignedHubId: updatePackageDto.assignedHubId,
        batchId: updatePackageDto.batchId,
        recipientName: updatePackageDto.recipientName,
        recipientPhone: updatePackageDto.recipientPhone,
        deliveryAddress: updatePackageDto.deliveryAddress,
        notes: updatePackageDto.notes,
      },
      include: {
        assignedHub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Package updated: ${updatedPackage.trackingNumber} (ID: ${id})`);

    return updatedPackage;
  }

  async deletePackage(id: string) {
    const packageData = await this.prisma.package.findUnique({
      where: { id },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    // Don't allow deletion of packages in transit or delivered
    if (
      packageData.status === PackageStatus.OUT_FOR_DELIVERY ||
      packageData.status === PackageStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot delete package with status: ${packageData.status}`,
      );
    }

    await this.prisma.package.delete({
      where: { id },
    });

    this.logger.log(`Package deleted: ${packageData.trackingNumber} (ID: ${id})`);

    return { message: 'Package successfully deleted' };
  }

  // ==================== Batch Operations ====================

  async createBatch(createBatchDto: CreateBatchDto) {
    // Check if batch number already exists
    const existingBatch = await this.prisma.batch.findUnique({
      where: { batchNumber: createBatchDto.batchNumber },
    });

    if (existingBatch) {
      throw new ConflictException('Batch with this number already exists');
    }

    // Validate hub
    const hub = await this.prisma.hub.findUnique({
      where: { id: createBatchDto.hubId },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    if (hub.status !== HubStatus.ACTIVE) {
      throw new BadRequestException('Cannot create batch for inactive hub');
    }

    const batch = await this.prisma.batch.create({
      data: {
        batchNumber: createBatchDto.batchNumber,
        hubId: createBatchDto.hubId,
        expectedDeliveryDate: createBatchDto.expectedDeliveryDate
          ? new Date(createBatchDto.expectedDeliveryDate)
          : null,
        notes: createBatchDto.notes,
        status: BatchStatus.PENDING,
      },
      include: {
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    this.logger.log(`Batch created: ${batch.batchNumber} (ID: ${batch.id})`);

    return batch;
  }

  async findAllBatches(hubId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = hubId ? { hubId } : {};

    const [batches, total] = await Promise.all([
      this.prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hub: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              packages: true,
            },
          },
        },
      }),
      this.prisma.batch.count({ where }),
    ]);

    return {
      data: batches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBatchById(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
            host: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        packages: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
            recipientName: true,
            deliveryAddress: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  async updateBatch(id: string, updateBatchDto: UpdateBatchDto) {
    const existingBatch = await this.prisma.batch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      throw new NotFoundException('Batch not found');
    }

    const updatedBatch = await this.prisma.batch.update({
      where: { id },
      data: {
        status: updateBatchDto.status,
        expectedDeliveryDate: updateBatchDto.expectedDeliveryDate
          ? new Date(updateBatchDto.expectedDeliveryDate)
          : undefined,
        notes: updateBatchDto.notes,
      },
      include: {
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    this.logger.log(`Batch updated: ${updatedBatch.batchNumber} (ID: ${id})`);

    return updatedBatch;
  }

  async deleteBatch(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            packages: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Don't allow deletion if batch has packages
    if (batch._count.packages > 0) {
      throw new BadRequestException(
        `Cannot delete batch with ${batch._count.packages} package(s). Remove packages first.`,
      );
    }

    await this.prisma.batch.delete({
      where: { id },
    });

    this.logger.log(`Batch deleted: ${batch.batchNumber} (ID: ${id})`);

    return { message: 'Batch successfully deleted' };
  }

  async assignPackagesToBatch(batchId: string, packageIds: string[]) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Update all packages to belong to this batch
    const result = await this.prisma.package.updateMany({
      where: {
        id: {
          in: packageIds,
        },
      },
      data: {
        batchId: batchId,
        assignedHubId: batch.hubId,
      },
    });

    this.logger.log(
      `${result.count} package(s) assigned to batch: ${batch.batchNumber} (ID: ${batchId})`,
    );

    return {
      message: `${result.count} package(s) assigned to batch successfully`,
      batchId,
      packagesAssigned: result.count,
    };
  }
}
