import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { PrismaService } from './infrastructure/prisma/prisma.service.js';

import { IAssetRepository } from './domain/ports/asset.repository.port.js';
import { IPortfolioRepository } from './domain/ports/portfolio.repository.port.js';
import { ICategoryRepository } from './domain/ports/category.repository.port.js';
import { ITagRepository } from './domain/ports/tag.repository.port.js';
import { IAssetTypeRepository } from './domain/ports/asset-type.repository.port.js';
import { IAssetSnapshotRepository } from './domain/ports/asset-snapshot.repository.port.js';
import { IPortfolioSnapshotRepository } from './domain/ports/portfolio-snapshot.repository.port.js';

import { PrismaAssetRepository } from './infrastructure/repositories/prisma-asset.repository.js';
import { PrismaPortfolioRepository } from './infrastructure/repositories/prisma-portfolio.repository.js';
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository.js';
import { PrismaTagRepository } from './infrastructure/repositories/prisma-tag.repository.js';
import { PrismaAssetTypeRepository } from './infrastructure/repositories/prisma-asset-type.repository.js';
import { PrismaAssetSnapshotRepository } from './infrastructure/repositories/prisma-asset-snapshot.repository.js';
import { PrismaPortfolioSnapshotRepository } from './infrastructure/repositories/prisma-portfolio-snapshot.repository.js';

import { AssetService } from './application/services/asset.service.js';
import { PortfolioService } from './application/services/portfolio.service.js';
import { CategoryService } from './application/services/category.service.js';
import { TagService } from './application/services/tag.service.js';
import { AssetTypeService } from './application/services/asset-type.service.js';
import { AssetSnapshotService } from './application/services/asset-snapshot.service.js';

import { AssetController } from './presentation/controllers/asset.controller.js';
import { PortfolioController } from './presentation/controllers/portfolio.controller.js';
import { CategoryController } from './presentation/controllers/category.controller.js';
import { TagController } from './presentation/controllers/tag.controller.js';
import { AssetTypeController } from './presentation/controllers/asset-type.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    AssetController,
    PortfolioController,
    CategoryController,
    TagController,
    AssetTypeController,
  ],
  providers: [
    // Repository bindings (port → implementation)
    { provide: IAssetRepository, useClass: PrismaAssetRepository },
    { provide: IPortfolioRepository, useClass: PrismaPortfolioRepository },
    { provide: ICategoryRepository, useClass: PrismaCategoryRepository },
    { provide: ITagRepository, useClass: PrismaTagRepository },
    { provide: IAssetTypeRepository, useClass: PrismaAssetTypeRepository },
    { provide: IAssetSnapshotRepository, useClass: PrismaAssetSnapshotRepository },
    { provide: IPortfolioSnapshotRepository, useClass: PrismaPortfolioSnapshotRepository },

    // Application services
    AssetService,
    PortfolioService,
    CategoryService,
    TagService,
    AssetTypeService,
    AssetSnapshotService,
  ],
})
export class AppModule {}

