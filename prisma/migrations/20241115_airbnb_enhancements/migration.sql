-- CreateEnum for MessageStatus
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum for NotificationType
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum for NotificationCategory
CREATE TYPE "NotificationCategory" AS ENUM ('APPLICATION_STATUS', 'PACKAGE_DELIVERY', 'MESSAGE_RECEIVED', 'ACCOUNT_UPDATE', 'SYSTEM_ALERT');

-- AlterEnum - Add new values to HubStatus
ALTER TYPE "HubStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "HubStatus" ADD VALUE 'APPROVED';
ALTER TYPE "HubStatus" ADD VALUE 'REJECTED';

-- AlterTable User - Add new fields
ALTER TABLE "users" ADD COLUMN "date_of_birth" DATE;
ALTER TABLE "users" ADD COLUMN "profile_photo_url" TEXT;
ALTER TABLE "users" ADD COLUMN "street_address" TEXT;
ALTER TABLE "users" ADD COLUMN "city" TEXT;
ALTER TABLE "users" ADD COLUMN "state" TEXT;
ALTER TABLE "users" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "users" ADD COLUMN "country" TEXT DEFAULT 'USA';
ALTER TABLE "users" ADD COLUMN "is_email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_id_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "id_document_url" TEXT;
ALTER TABLE "users" ADD COLUMN "id_document_type" TEXT;
ALTER TABLE "users" ADD COLUMN "bank_account_last4" TEXT;
ALTER TABLE "users" ADD COLUMN "bank_account_name" TEXT;
ALTER TABLE "users" ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "users" ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "sms_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "push_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- AlterTable Hub - Add new fields
ALTER TABLE "hubs" ADD COLUMN "property_type" TEXT;
ALTER TABLE "hubs" ADD COLUMN "storage_area_sqft" INTEGER;
ALTER TABLE "hubs" ADD COLUMN "has_secured_area" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "hubs" ADD COLUMN "has_camera_system" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "hubs" ADD COLUMN "has_parking_space" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "hubs" ADD COLUMN "operating_hours" TEXT;
ALTER TABLE "hubs" ADD COLUMN "available_days" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "hubs" ADD COLUMN "preferred_delivery_time" TEXT;
ALTER TABLE "hubs" ADD COLUMN "application_notes" TEXT;
ALTER TABLE "hubs" ADD COLUMN "reviewed_by" TEXT;
ALTER TABLE "hubs" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "hubs" ADD COLUMN "review_notes" TEXT;
ALTER TABLE "hubs" ADD COLUMN "rejection_reason" TEXT;
ALTER TABLE "hubs" ADD COLUMN "approved_at" TIMESTAMP(3);
ALTER TABLE "hubs" ADD COLUMN "activated_at" TIMESTAMP(3);

-- CreateTable HubPhoto
CREATE TABLE "hub_photos" (
    "id" TEXT NOT NULL,
    "hub_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "description" TEXT,
    "photo_type" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hub_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable Message
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "hub_id" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hub_photos_hub_id_idx" ON "hub_photos"("hub_id");
CREATE INDEX "hub_photos_is_approved_idx" ON "hub_photos"("is_approved");

CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");
CREATE INDEX "messages_hub_id_idx" ON "messages"("hub_id");
CREATE INDEX "messages_status_idx" ON "messages"("status");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");
CREATE INDEX "notifications_category_idx" ON "notifications"("category");
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");

-- AddForeignKey
ALTER TABLE "hub_photos" ADD CONSTRAINT "hub_photos_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
