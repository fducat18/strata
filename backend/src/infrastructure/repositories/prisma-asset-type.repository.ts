import { Injectable } from '@nestjs/common';
import { AssetType as AssetTypeModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { IAssetTypeRepository } from '../../domain/ports/asset-type.repository.port.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';

@Injectable()
export class PrismaAssetTypeRepository extends IAssetTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: AssetTypeModel): AssetType {
    return new AssetType(data.id, data.code, data.label);
  }

  async findById(id: string): Promise<AssetType | null> {
    const result = await this.prisma.assetType.findUnique({
      where: { id },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<AssetType[]> {
    const results = await this.prisma.assetType.findMany();
    return results.map((r) => this.mapToEntity(r));
  }
}
