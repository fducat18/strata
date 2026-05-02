import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infrastructure/prisma/prisma.module.js';

import { IAssetRepository } from './domain/ports/asset.repository.port.js';
import { ICategoryRepository } from './domain/ports/category.repository.port.js';
import { ITagRepository } from './domain/ports/tag.repository.port.js';
import { IAssetTypeRepository } from './domain/ports/asset-type.repository.port.js';
import { IAssetSnapshotRepository } from './domain/ports/asset-snapshot.repository.port.js';
import { IPortfolioSnapshotRepository } from './domain/ports/portfolio-snapshot.repository.port.js';
import { ITransactionRepository } from './domain/ports/transaction.repository.port.js';

import { PrismaAssetRepository } from './infrastructure/repositories/prisma-asset.repository.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository.js';
import { PrismaTagRepository } from './infrastructure/repositories/prisma-tag.repository.js';
import { PrismaAssetTypeRepository } from './infrastructure/repositories/prisma-asset-type.repository.js';
import { PrismaAssetSnapshotRepository } from './infrastructure/repositories/prisma-asset-snapshot.repository.js';
import { PrismaPortfolioSnapshotRepository } from './infrastructure/repositories/prisma-portfolio-snapshot.repository.js';
import { PrismaTransactionRepository } from './infrastructure/repositories/prisma-transaction.repository.js';

import { AssetService } from './application/services/asset.service.js';
import { PortfolioSnapshotService } from './application/services/portfolio-snapshot.service.js';
import { CategoryService } from './application/services/category.service.js';
import { TagService } from './application/services/tag.service.js';
import { AssetTypeService } from './application/services/asset-type.service.js';
import { AssetSnapshotService } from './application/services/asset-snapshot.service.js';
import { BackupService } from './application/services/backup/index.js';

import { AssetController } from './presentation/controllers/asset.controller.js';
import { PortfolioSnapshotController } from './presentation/controllers/portfolio-snapshot.controller.js';
import { CategoryController } from './presentation/controllers/category.controller.js';
import { TagController } from './presentation/controllers/tag.controller.js';
import { AssetTypeController } from './presentation/controllers/asset-type.controller.js';
import { HealthController } from './presentation/controllers/health.controller.js';
import { VersionController } from './presentation/controllers/version.controller.js';
import { AdminController } from './presentation/controllers/admin.controller.js';

import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './presentation/filters/index.js';
import { RequestIdMiddleware } from './infrastructure/middleware/request-id.middleware.js';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
  ],
  controllers: [
    AssetController,
    PortfolioSnapshotController,
    CategoryController,
    TagController,
    AssetTypeController,
    HealthController,
    VersionController,
    AdminController,
  ],
  providers: [
    { provide: IAssetRepository, useClass: PrismaAssetRepository },
    { provide: ICategoryRepository, useClass: PrismaCategoryRepository },
    { provide: ITagRepository, useClass: PrismaTagRepository },
    { provide: IAssetTypeRepository, useClass: PrismaAssetTypeRepository },
    {
      provide: IAssetSnapshotRepository,
      useClass: PrismaAssetSnapshotRepository,
    },
    {
      provide: IPortfolioSnapshotRepository,
      useClass: PrismaPortfolioSnapshotRepository,
    },
    {
      provide: ITransactionRepository,
      useClass: PrismaTransactionRepository,
    },

    AssetService,
    PortfolioSnapshotService,
    CategoryService,
    TagService,
    AssetTypeService,
    AssetSnapshotService,
    BackupService,

    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaValidationExceptionFilter },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
