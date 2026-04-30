import { Injectable } from '@nestjs/common';
import { Asset } from '../../domain/entities/index.js';
import {
  IAssetRepository,
  IPortfolioRepository,
  IAssetTypeRepository,
  type CreateAssetData,
  type UpdateAssetData,
} from '../../domain/ports/index.js';
import {
  AssetNotFoundException,
  PortfolioNotFoundException,
  AssetTypeNotFoundException,
} from '../../domain/exceptions/index.js';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: IAssetRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly assetTypeRepository: IAssetTypeRepository,
  ) {}

  async create(data: CreateAssetData): Promise<Asset> {
    const portfolio = await this.portfolioRepository.findById(data.portfolioId);
    if (!portfolio)
      throw new PortfolioNotFoundException(
        `Portfolio ${data.portfolioId} not found`,
      );

    const assetType = await this.assetTypeRepository.findById(data.assetTypeId);
    if (!assetType)
      throw new AssetTypeNotFoundException(
        `Asset type ${data.assetTypeId} not found`,
      );

    return this.assetRepository.save(data);
  }

  async findById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) throw new AssetNotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.findAll();
  }

  async findByPortfolio(portfolioId: string): Promise<Asset[]> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio)
      throw new PortfolioNotFoundException(
        `Portfolio ${portfolioId} not found`,
      );
    return this.assetRepository.findByPortfolio(portfolioId);
  }

  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    await this.findById(id);

    if (data.assetTypeId) {
      const assetType = await this.assetTypeRepository.findById(
        data.assetTypeId,
      );
      if (!assetType)
        throw new AssetTypeNotFoundException(
          `Asset type ${data.assetTypeId} not found`,
        );
    }

    return this.assetRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.assetRepository.delete(id);
  }

  async dispose(id: string): Promise<Asset> {
    await this.findById(id);
    return this.assetRepository.dispose(id);
  }

  async addCategory(assetId: string, categoryId: string): Promise<Asset> {
    await this.findById(assetId);
    return this.assetRepository.addCategory(assetId, categoryId);
  }

  async removeCategory(assetId: string, categoryId: string): Promise<Asset> {
    await this.findById(assetId);
    return this.assetRepository.removeCategory(assetId, categoryId);
  }

  async addTag(assetId: string, tagId: string): Promise<Asset> {
    await this.findById(assetId);
    return this.assetRepository.addTag(assetId, tagId);
  }

  async removeTag(assetId: string, tagId: string): Promise<Asset> {
    await this.findById(assetId);
    return this.assetRepository.removeTag(assetId, tagId);
  }
}
