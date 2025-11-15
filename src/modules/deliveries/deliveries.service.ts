import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { ProofOfDeliveryDto } from './dto/proof-of-delivery.dto';
import { PackageStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDelivery(createDeliveryDto: CreateDeliveryDto, userId: string) {
    // Validate package exists
    const packageData = await this.prisma.package.findUnique({
      where: { id: createDeliveryDto.packageId },
      include: { assignedHub: true },
    });

    if (!packageData) {
      throw new NotFoundException('Package not found');
    }

    // Check if delivery already exists for this package
    const existingDelivery = await this.prisma.delivery.findUnique({
      where: { packageId: createDeliveryDto.packageId },
    });

    if (existingDelivery) {
      throw new BadRequestException('Delivery already exists for this package');
    }

    // Validate package status
    if (
      packageData.status !== PackageStatus.AT_HUB &&
      packageData.status !== PackageStatus.OUT_FOR_DELIVERY
    ) {
      throw new BadRequestException(
        `Cannot create delivery for package with status: ${packageData.status}`,
      );
    }

    // Validate hub exists
    const hub = await this.prisma.hub.findUnique({
      where: { id: createDeliveryDto.hubId },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    // Create delivery
    const delivery = await this.prisma.delivery.create({
      data: {
        packageId: createDeliveryDto.packageId,
        hubId: createDeliveryDto.hubId,
        status: DeliveryStatus.PENDING,
        notes: createDeliveryDto.notes,
      },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
            recipientName: true,
            recipientPhone: true,
            deliveryAddress: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Update package status to OUT_FOR_DELIVERY if it's AT_HUB
    if (packageData.status === PackageStatus.AT_HUB) {
      await this.prisma.package.update({
        where: { id: packageData.id },
        data: { status: PackageStatus.OUT_FOR_DELIVERY },
      });
    }

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType: 'DELIVERY_CREATED',
        packageId: packageData.id,
        hubId: createDeliveryDto.hubId,
        performedBy: userId,
        message: 'Delivery created',
        metadata: {
          deliveryId: delivery.id,
        },
      },
    });

    this.logger.log(`Delivery created for package: ${packageData.trackingNumber} (ID: ${delivery.id})`);

    return delivery;
  }

  async updateDelivery(deliveryId: string, updateDeliveryDto: UpdateDeliveryDto, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { package: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: updateDeliveryDto.status,
        notes: updateDeliveryDto.notes,
      },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType: 'DELIVERY_UPDATED',
        packageId: delivery.packageId,
        hubId: delivery.hubId,
        performedBy: userId,
        message: `Delivery status updated to ${updateDeliveryDto.status}`,
        metadata: {
          deliveryId,
          previousStatus: delivery.status,
          newStatus: updateDeliveryDto.status,
        },
      },
    });

    this.logger.log(`Delivery updated: ${deliveryId} - Status: ${updateDeliveryDto.status}`);

    return updatedDelivery;
  }

  async submitProofOfDelivery(
    deliveryId: string,
    proofOfDeliveryDto: ProofOfDeliveryDto,
    userId: string,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        package: true,
        hub: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status === DeliveryStatus.COMPLETED) {
      throw new BadRequestException('Delivery has already been completed');
    }

    // Update delivery with proof of delivery
    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.COMPLETED,
        proofOfDeliveryUrl: proofOfDeliveryDto.proofOfDeliveryUrl,
        deliveryLatitude: proofOfDeliveryDto.latitude,
        deliveryLongitude: proofOfDeliveryDto.longitude,
        recipientName: proofOfDeliveryDto.recipientName,
        deliveredAt: new Date(),
        notes: proofOfDeliveryDto.notes || delivery.notes,
      },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
            recipientName: true,
            deliveryAddress: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Update package status to DELIVERED
    await this.prisma.package.update({
      where: { id: delivery.packageId },
      data: { status: PackageStatus.DELIVERED },
    });

    // Update hub metrics (increment total deliveries)
    await this.prisma.hub.update({
      where: { id: delivery.hubId },
      data: {
        totalDeliveries: {
          increment: 1,
        },
      },
    });

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType: 'DELIVERY_COMPLETED',
        packageId: delivery.packageId,
        hubId: delivery.hubId,
        performedBy: userId,
        latitude: proofOfDeliveryDto.latitude,
        longitude: proofOfDeliveryDto.longitude,
        message: 'Delivery completed with proof of delivery',
        metadata: {
          deliveryId,
          proofOfDeliveryUrl: proofOfDeliveryDto.proofOfDeliveryUrl,
          recipientName: proofOfDeliveryDto.recipientName,
          notes: proofOfDeliveryDto.notes,
        },
      },
    });

    this.logger.log(
      `Proof of delivery submitted for package: ${delivery.package.trackingNumber} (Delivery ID: ${deliveryId})`,
    );

    return updatedDelivery;
  }

  async markDeliveryFailed(deliveryId: string, reason: string, userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { package: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status === DeliveryStatus.COMPLETED) {
      throw new BadRequestException('Cannot mark completed delivery as failed');
    }

    // Update delivery status
    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.FAILED,
        notes: reason,
      },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Update package status to FAILED
    await this.prisma.package.update({
      where: { id: delivery.packageId },
      data: { status: PackageStatus.FAILED },
    });

    // Create event log
    await this.prisma.eventLog.create({
      data: {
        eventType: 'DELIVERY_FAILED',
        packageId: delivery.packageId,
        hubId: delivery.hubId,
        performedBy: userId,
        message: `Delivery failed: ${reason}`,
        metadata: {
          deliveryId,
          reason,
        },
      },
    });

    this.logger.log(
      `Delivery marked as failed: ${deliveryId} - Reason: ${reason}`,
    );

    return updatedDelivery;
  }

  async findDeliveryById(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
            recipientName: true,
            recipientPhone: true,
            deliveryAddress: true,
            weight: true,
            dimensions: true,
          },
        },
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
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  async findDeliveriesByHub(
    hubId: string,
    status?: DeliveryStatus,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { hubId };

    if (status) {
      where.status = status;
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          package: {
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
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      data: deliveries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findDeliveryByPackage(packageId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { packageId },
      include: {
        package: {
          select: {
            id: true,
            trackingNumber: true,
            barcode: true,
            status: true,
            recipientName: true,
            recipientPhone: true,
            deliveryAddress: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found for this package');
    }

    return delivery;
  }
}
