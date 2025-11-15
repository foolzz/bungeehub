/**
 * Messages Service
 * Handles in-app messaging between users
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a message
   */
  async sendMessage(senderId: string, createMessageDto: CreateMessageDto) {
    const { receiverId, hubId, subject, content } = createMessageDto;

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // If hubId provided, verify it exists
    if (hubId) {
      const hub = await this.prisma.hub.findUnique({
        where: { id: hubId },
      });

      if (!hub) {
        throw new NotFoundException('Hub not found');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        hubId,
        subject,
        content,
        status: MessageStatus.SENT,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Create notification for receiver
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'IN_APP',
        category: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: `You have a new message from ${message.sender.fullName}`,
        data: {
          messageId: message.id,
          senderId,
          subject,
        },
      },
    });

    return message;
  }

  /**
   * Get inbox messages
   */
  async getInbox(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              profilePhotoUrl: true,
            },
          },
          hub: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { receiverId: userId } }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get sent messages
   */
  async getSentMessages(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { senderId: userId },
        include: {
          receiver: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              profilePhotoUrl: true,
            },
          },
          hub: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { senderId: userId } }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation between two users
   */
  async getConversation(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);

    // Mark received messages as read
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        status: { not: MessageStatus.READ },
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
          },
        },
        hub: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender and receiver can view the message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Mark as read if receiver is viewing
    if (message.receiverId === userId && message.status !== MessageStatus.READ) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: MessageStatus.READ,
          readAt: new Date(),
        },
      });
      message.status = MessageStatus.READ;
      message.readAt = new Date();
    }

    return message;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        status: { not: MessageStatus.READ },
      },
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can mark message as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get conversations list (unique users you've messaged with)
   */
  async getConversationsList(userId: string) {
    // Get all unique users the current user has conversations with
    const sent = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const received = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const userIds = [
      ...new Set([
        ...sent.map((m) => m.receiverId),
        ...received.map((m) => m.senderId),
      ]),
    ];

    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      userIds.map(async (otherUserId) => {
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                profilePhotoUrl: true,
              },
            },
          },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            status: { not: MessageStatus.READ },
          },
        });

        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profilePhotoUrl: true,
          },
        });

        return {
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Sort by last message time
    return conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt?.getTime() || 0;
      const timeB = b.lastMessage?.createdAt?.getTime() || 0;
      return timeB - timeA;
    });
  }
}
