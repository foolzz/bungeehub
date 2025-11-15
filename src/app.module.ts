import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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

// Conditionally include ServeStaticModule based on environment
const getImports = () => {
  const imports = [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ];

  // Only serve static files if SERVE_STATIC is true (default: true for combined mode)
  const serveStatic = process.env.SERVE_STATIC !== 'false';
  if (serveStatic) {
    imports.push(
      ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'web', 'out'),
        exclude: ['/api*'],
      }),
    );
  }

  imports.push(
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
  );

  return imports;
};

@Module({
  imports: getImports(),
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
