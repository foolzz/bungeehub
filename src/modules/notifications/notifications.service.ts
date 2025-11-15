/**
 * Notifications Service
 * Handles email, SMS, push, and in-app notifications
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create in-app notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        category,
        title,
        message,
        data,
      },
    });
  }

  /**
   * Send email notification
   * TODO: Integrate with email service (SendGrid, AWS SES, etc.)
   */
  async sendEmail(to: string, subject: string, body: string) {
    // For now, just log. In production, integrate with email service
    this.logger.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    this.logger.log(`Body: ${body}`);

    // Example with SendGrid (uncomment when ready):
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to,
    //   from: process.env.FROM_EMAIL,
    //   subject,
    //   html: body,
    // });

    return { success: true, message: 'Email sent (logged for now)' };
  }

  /**
   * Send SMS notification
   * TODO: Integrate with Twilio or similar
   */
  async sendSMS(to: string, message: string) {
    // For now, just log. In production, integrate with Twilio
    this.logger.log(`[SMS] To: ${to}, Message: ${message}`);

    // Example with Twilio (uncomment when ready):
    // const twilio = require('twilio');
    // const client = twilio(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN,
    // );
    // await client.messages.create({
    //   body: message,
    //   to,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });

    return { success: true, message: 'SMS sent (logged for now)' };
  }

  /**
   * Send push notification
   * TODO: Integrate with Firebase Cloud Messaging
   */
  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    this.logger.log(`[PUSH] UserId: ${userId}, Title: ${title}`);

    // Example with Firebase (uncomment when ready):
    // const admin = require('firebase-admin');
    // const userToken = await this.getUserFCMToken(userId);
    // if (userToken) {
    //   await admin.messaging().send({
    //     token: userToken,
    //     notification: { title, body },
    //     data,
    //   });
    // }

    return { success: true, message: 'Push notification sent (logged for now)' };
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Send notification to user (auto-select channels based on user preferences)
   */
  async notifyUser(
    userId: string,
    category: NotificationCategory,
    title: string,
    message: string,
    data?: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const promises = [];

    // Always create in-app notification
    promises.push(
      this.createNotification(userId, 'IN_APP', category, title, message, data),
    );

    // Send email if user has email notifications enabled
    if (user.emailNotifications && user.email) {
      promises.push(this.sendEmail(user.email, title, message));
    }

    // Send SMS for important categories
    const smsCategories: NotificationCategory[] = [
      NotificationCategory.APPLICATION_STATUS,
      NotificationCategory.PACKAGE_DELIVERY,
    ];
    if (
      user.smsNotifications &&
      user.phone &&
      smsCategories.includes(category)
    ) {
      promises.push(this.sendSMS(user.phone, `${title}: ${message}`));
    }

    // Send push notification
    if (user.pushNotifications) {
      promises.push(this.sendPushNotification(userId, title, message, data));
    }

    await Promise.all(promises);

    return { success: true, message: 'Notifications sent' };
  }
}
