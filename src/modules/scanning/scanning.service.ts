import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ScanPackageDto } from './dto/scan-package.dto';
import { ScanBatchDto } from './dto/scan-batch.dto';
import { PackageStatus, BatchStatus } from '@prisma/client';

@Injectable()
export class ScanningService {
  private readonly logger = new Logger(ScanningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scanPackage(scanPackageDto: ScanPackageDto, userId: string) {
    // Find package by barcode
    const packageData = await this.prisma.package.findUnique({
      where: { barcode: scanPackageDto.barcode },
      include: {
        assignedHub: true,
        batch: true,
      },
    });

    if (!packageData) {
      throw new NotFoundException(`Package with barcode ${scanPackageDto.barcode} not found`);
    }

    // Determine new status based on current status
    let newStatus = packageData.status;
    let eventType = 'PACKAGE_SCANNED';
    let eventMessage = 'Package scanned';

    switch (packageData.status) {
      case PackageStatus.PENDING:
        newStatus = PackageStatus.AT_HUB;
        eventType = 'PACKAGE_ARRIVED';
        eventMessage = `Package arrived at hub: ${packageData.assignedHub?.name || 'Unknown'}`;
        break;
      case PackageStatus.AT_HUB:
        newStatus = PackageStatus.OUT_FOR_DELIVERY;
        eventType = 'PACKAGE_OUT_FOR_DELIVERY';
        eventMessage = 'Package out for delivery';
        break;
      case PackageStatus.OUT_FOR_DELIVERY:
        // Scanning while out for delivery - maybe returned to hub
        eventType = 'PACKAGE_SCANNED';
        eventMessage = 'Package scanned while out for delivery';
        break;
      case PackageStatus.DELIVERED:
        throw new BadRequestException('Package has already been delivered');
      case PackageStatus.FAILED:
        // Re-attempting failed delivery
        newStatus = PackageStatus.AT_HUB;
        eventType = 'PACKAGE_RETRY';
        eventMessage = 'Failed package returned to hub for retry';
        break;
      case PackageStatus.RETURNED:
        newStatus = PackageStatus.AT_HUB;
        eventType = 'PACKAGE_RETURNED_TO_HUB';
        eventMessage = 'Returned package back at hub';
        break;
    }

    // Update package status
    const updatedPackage = await this.prisma.package.update({
      where: { id: packageData.id },
      data: { status: newStatus },
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

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType,
        packageId: packageData.id,
        hubId: packageData.assignedHubId,
        performedBy: userId,
        latitude: scanPackageDto.latitude,
        longitude: scanPackageDto.longitude,
        metadata: {
          barcode: scanPackageDto.barcode,
          previousStatus: packageData.status,
          newStatus,
          notes: scanPackageDto.notes,
        },
        message: eventMessage,
      },
    });

    this.logger.log(
      `Package scanned: ${packageData.trackingNumber} - ${packageData.status} -> ${newStatus}`,
    );

    return {
      package: updatedPackage,
      previousStatus: packageData.status,
      newStatus,
      eventMessage,
    };
  }

  async scanBatch(scanBatchDto: ScanBatchDto, userId: string) {
    // Find batch by batch number
    const batch = await this.prisma.batch.findUnique({
      where: { batchNumber: scanBatchDto.batchNumber },
      include: {
        hub: true,
        packages: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${scanBatchDto.batchNumber} not found`);
    }

    // Determine new batch status
    let newStatus = batch.status;
    let eventType = 'BATCH_SCANNED';
    let eventMessage = 'Batch scanned';

    switch (batch.status) {
      case BatchStatus.PENDING:
        newStatus = BatchStatus.IN_TRANSIT;
        eventType = 'BATCH_IN_TRANSIT';
        eventMessage = `Batch in transit to hub: ${batch.hub.name}`;
        break;
      case BatchStatus.IN_TRANSIT:
        newStatus = BatchStatus.ARRIVED;
        eventType = 'BATCH_ARRIVED';
        eventMessage = `Batch arrived at hub: ${batch.hub.name}`;
        break;
      case BatchStatus.ARRIVED:
        newStatus = BatchStatus.DELIVERED;
        eventType = 'BATCH_DELIVERED';
        eventMessage = 'Batch delivery completed';
        break;
      case BatchStatus.DELIVERED:
        throw new BadRequestException('Batch has already been delivered');
    }

    // Update batch status
    const updatedBatch = await this.prisma.batch.update({
      where: { id: batch.id },
      data: { status: newStatus },
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
    });

    // If batch arrived, update all packages to AT_HUB
    if (newStatus === BatchStatus.ARRIVED) {
      await this.prisma.package.updateMany({
        where: {
          batchId: batch.id,
          status: PackageStatus.PENDING,
        },
        data: {
          status: PackageStatus.AT_HUB,
        },
      });
    }

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType,
        batchId: batch.id,
        hubId: batch.hubId,
        performedBy: userId,
        latitude: scanBatchDto.latitude,
        longitude: scanBatchDto.longitude,
        metadata: {
          batchNumber: scanBatchDto.batchNumber,
          previousStatus: batch.status,
          newStatus,
          packageCount: batch.packages.length,
          packageBarcodes: scanBatchDto.packageBarcodes,
          notes: scanBatchDto.notes,
        },
        message: eventMessage,
      },
    });

    this.logger.log(`Batch scanned: ${batch.batchNumber} - ${batch.status} -> ${newStatus}`);

    return {
      batch: updatedBatch,
      previousStatus: batch.status,
      newStatus,
      eventMessage,
      packagesAffected: batch.packages.length,
    };
  }

  async getPackageScanHistory(packageId: string) {
    const packageData = await this.prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    const events = await this.prisma.eventLog.findMany({
      where: { packageId },
      orderBy: { timestamp: 'desc' },
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

    return {
      package: {
        id: packageData.id,
        trackingNumber: packageData.trackingNumber,
        barcode: packageData.barcode,
        status: packageData.status,
      },
      scanHistory: events,
    };
  }

  async getBatchScanHistory(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const events = await this.prisma.eventLog.findMany({
      where: { batchId },
      orderBy: { timestamp: 'desc' },
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

    return {
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        status: batch.status,
      },
      scanHistory: events,
    };
  }
}
