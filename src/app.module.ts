import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HubsModule } from './modules/hubs/hubs.module';
import { PackagesModule } from './modules/packages/packages.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { ScanningModule } from './modules/scanning/scanning.module';
import { RankingsModule } from './modules/rankings/rankings.module';
import { UploadModule } from './modules/upload/upload.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    HubsModule,
    PackagesModule,
    DeliveriesModule,
    ScanningModule,
    RankingsModule,
    UploadModule,
    MessagesModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
