import { Injectable } from '@nestjs/common';
import { AssetType as AssetTypeModel, $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { IAssetTypeRepository } from '../../domain/ports/asset-type.repository.port.js';
import type { CreateAssetTypeData, UpdateAssetTypeData } from '../../domain/ports/asset-type.repository.port.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';

@Injectable()
export class PrismaAssetTypeRepository extends IAssetTypeRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapToEntity(data: AssetTypeModel): AssetType {
    return new AssetType(data.id, data.code, data.label, data.group);
  }

  async findById(id: string): Promise<AssetType | null> {
    const result = await this.prisma.assetType.findUnique({ where: { id } });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<AssetType[]> {
    const results = await this.prisma.assetType.findMany();
    return results.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateAssetTypeData): Promise<AssetType> {
    const result = await this.prisma.assetType.create({
      data: { code: data.code, label: data.label, group: data.group as $Enums.AssetTypeGroup },
    });
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateAssetTypeData): Promise<AssetType> {
    const result = await this.prisma.assetType.update({
      where: { id },
      data: { label: data.label, group: data.group as $Enums.AssetTypeGroup },
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetType.delete({ where: { id } });
  }

  async countByTypeId(assetTypeId: string): Promise<number> {
    return this.prisma.asset.count({ where: { assetTypeId } });
  }
}
