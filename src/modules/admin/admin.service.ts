/**
 * Admin Service
 * Handles admin operations for hub review and management
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HubStatus } from '@prisma/client';
import { ReviewHubDto, RequestMoreInfoDto } from './dto/review-hub.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all pending hub applications
   */
  async getPendingApplications(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [hubs, total] = await Promise.all([
      this.prisma.hub.findMany({
        where: {
          status: { in: [HubStatus.PENDING, HubStatus.UNDER_REVIEW] },
        },
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              streetAddress: true,
              city: true,
              state: true,
              postalCode: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isIdVerified: true,
              profilePhotoUrl: true,
              createdAt: true,
            },
          },
          photos: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.hub.count({
        where: {
          status: { in: [HubStatus.PENDING, HubStatus.UNDER_REVIEW] },
        },
      }),
    ]);

    return {
      hubs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get application details by ID
   */
  async getApplicationDetails(hubId: string) {
    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            profilePhotoUrl: true,
            streetAddress: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            isIdVerified: true,
            idDocumentUrl: true,
            idDocumentType: true,
            bankAccountLast4: true,
            bankAccountName: true,
            createdAt: true,
          },
        },
        photos: {
          orderBy: { displayOrder: 'asc' },
        },
        packages: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
          },
          take: 5,
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 7,
        },
      },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    return hub;
  }

  /**
   * Review hub application
   */
  async reviewApplication(
    hubId: string,
    adminId: string,
    reviewDto: ReviewHubDto,
  ) {
    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    const { status, reviewNotes, rejectionReason } = reviewDto;

    // Validate status transition
    if (hub.status === HubStatus.ACTIVE || hub.status === HubStatus.SUSPENDED) {
      throw new BadRequestException(
        'Cannot review hub that is already active or suspended',
      );
    }

    const updateData: any = {
      status,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes,
    };

    if (status === HubStatus.APPROVED) {
      updateData.approvedAt = new Date();
    } else if (status === HubStatus.REJECTED) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedHub = await this.prisma.hub.update({
      where: { id: hubId },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for host
    let notificationMessage = '';
    let notificationTitle = '';

    if (status === HubStatus.APPROVED) {
      notificationTitle = 'Hub Application Approved!';
      notificationMessage = `Congratulations! Your hub "${hub.name}" has been approved. It will be activated shortly.`;
    } else if (status === HubStatus.REJECTED) {
      notificationTitle = 'Hub Application Not Approved';
      notificationMessage = `Unfortunately, your hub "${hub.name}" application was not approved. Reason: ${rejectionReason || 'See review notes'}`;
    } else if (status === HubStatus.UNDER_REVIEW) {
      notificationTitle = 'Hub Application Under Review';
      notificationMessage = `Your hub "${hub.name}" is now under review by our team.`;
    }

    await this.prisma.notification.create({
      data: {
        userId: hub.hostId,
        type: 'IN_APP',
        category: 'APPLICATION_STATUS',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          hubId: hub.id,
          status,
          reviewNotes,
        },
      },
    });

    return updatedHub;
  }

  /**
   * Request more information from host
   */
  async requestMoreInfo(
    hubId: string,
    adminId: string,
    requestDto: RequestMoreInfoDto,
  ) {
    const hub = await this.prisma.hub.findUnique({
      where: { id: hubId },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found');
    }

    // Update hub status to UNDER_REVIEW
    await this.prisma.hub.update({
      where: { id: hubId },
      data: {
        status: HubStatus.UNDER_REVIEW,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Send message to host
    await this.prisma.message.create({
      data: {
        senderId: adminId,
        receiverId: hub.hostId,
        hubId,
        subject:
          requestDto.subject ||
          `Additional Information Required: ${hub.name}`,
        content: requestDto.message,
      },
    });

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId: hub.hostId,
        type: 'IN_APP',
        category: 'MESSAGE_RECEIVED',
        title: 'Admin Requires More Information',
        message: `The admin team has requested additional information about your hub "${hub.name}"`,
        data: {
          hubId: hub.id,
        },
      },
    });

    return {
      message: 'Information request sent to host',
      hub,
    };
  }

  /**
   * Approve hub photo
   */
  async approvePhoto(photoId: string) {
    const photo = await this.prisma.hubPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return this.prisma.hubPhoto.update({
      where: { id: photoId },
      data: { isApproved: true },
    });
  }

  /**
   * Delete hub photo
   */
  async deletePhoto(photoId: string) {
    const photo = await this.prisma.hubPhoto.findUnique({
      where: { id: photoId },
      include: { hub: true },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.hubPhoto.delete({
      where: { id: photoId },
    });

    // Notify host
    await this.prisma.notification.create({
      data: {
        userId: photo.hub.hostId,
        type: 'IN_APP',
        category: 'ACCOUNT_UPDATE',
        title: 'Photo Removed',
        message: `A photo for your hub "${photo.hub.name}" has been removed by an administrator.`,
        data: {
          hubId: photo.hubId,
          photoId,
        },
      },
    });

    return { message: 'Photo deleted successfully' };
  }

  /**
   * Get all hubs (with filters)
   */
  async getAllHubs(
    page: number = 1,
    limit: number = 20,
    status?: HubStatus,
    tier?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (tier) {
      where.tier = tier;
    }

    const [hubs, total] = await Promise.all([
      this.prisma.hub.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              email: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.hub.count({ where }),
    ]);

    return {
      hubs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalHubs,
      pendingApplications,
      activeHubs,
      totalPackages,
      totalDeliveries,
      recentApplications,
    ] = await Promise.all([
      this.prisma.hub.count(),
      this.prisma.hub.count({
        where: { status: { in: [HubStatus.PENDING, HubStatus.UNDER_REVIEW] } },
      }),
      this.prisma.hub.count({ where: { status: HubStatus.ACTIVE } }),
      this.prisma.package.count(),
      this.prisma.delivery.count({ where: { status: 'DELIVERED' } }),
      this.prisma.hub.findMany({
        where: {
          status: { in: [HubStatus.PENDING, HubStatus.UNDER_REVIEW] },
        },
        include: {
          host: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalHubs,
      pendingApplications,
      activeHubs,
      totalPackages,
      totalDeliveries,
      recentApplications,
    };
  }
}
