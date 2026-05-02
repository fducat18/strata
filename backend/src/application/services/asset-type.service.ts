import { Injectable } from '@nestjs/common';
import { AssetType } from '../../domain/entities/index.js';
import { IAssetTypeRepository } from '../../domain/ports/index.js';
import type { CreateAssetTypeData, UpdateAssetTypeData } from '../../domain/ports/asset-type.repository.port.js';
import {
  AssetTypeNotFoundException,
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';

@Injectable()
export class AssetTypeService {
  constructor(private readonly assetTypeRepository: IAssetTypeRepository) {}

  async findById(id: string): Promise<AssetType> {
    const assetType = await this.assetTypeRepository.findById(id);
    if (!assetType) throw new AssetTypeNotFoundException(`Asset type ${id} not found`);
    return assetType;
  }

  async findAll(): Promise<AssetType[]> {
    return this.assetTypeRepository.findAll();
  }

  async create(data: CreateAssetTypeData): Promise<AssetType> {
    return this.assetTypeRepository.create(data);
  }

  async update(id: string, data: UpdateAssetTypeData): Promise<AssetType> {
    await this.findById(id);
    return this.assetTypeRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    const count = await this.assetTypeRepository.countByTypeId(id);
    if (count > 0) {
      throw new AssetTypeInUseException(
        `Asset type ${id} is referenced by ${count} asset(s) and cannot be deleted`,
      );
    }
    return this.assetTypeRepository.delete(id);
  }
}
