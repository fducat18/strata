import { Injectable } from '@nestjs/common';
import { AssetType } from '../../domain/entities/index.js';
import { IAssetTypeRepository } from '../../domain/ports/index.js';
import { AssetTypeNotFoundException } from '../../domain/exceptions/index.js';

@Injectable()
export class AssetTypeService {
  constructor(private readonly assetTypeRepository: IAssetTypeRepository) {}

  async findById(id: string): Promise<AssetType> {
    const assetType = await this.assetTypeRepository.findById(id);
    if (!assetType)
      throw new AssetTypeNotFoundException(`Asset type ${id} not found`);
    return assetType;
  }

  async findAll(): Promise<AssetType[]> {
    return this.assetTypeRepository.findAll();
  }
}
