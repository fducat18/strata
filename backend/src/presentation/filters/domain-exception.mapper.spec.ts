import { HttpStatus } from '@nestjs/common';
import { DomainExceptionMapper } from './domain-exception.mapper.js';
import {
  AssetNotFoundException,
  PortfolioSnapshotNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
} from '../../domain/exceptions/index.js';

describe('DomainExceptionMapper', () => {
  describe('map', () => {
    it('maps AssetNotFoundException to 404 ASSET_NOT_FOUND', () => {
      const result = DomainExceptionMapper.map(
        new AssetNotFoundException('not found'),
      );
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.code).toBe('ASSET_NOT_FOUND');
    });

    it('maps PortfolioSnapshotNotFoundException to 404 PORTFOLIO_SNAPSHOT_NOT_FOUND', () => {
      const result = DomainExceptionMapper.map(
        new PortfolioSnapshotNotFoundException('not found'),
      );
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.code).toBe('PORTFOLIO_SNAPSHOT_NOT_FOUND');
    });

    it('maps CategoryNotFoundException to 404 CATEGORY_NOT_FOUND', () => {
      const result = DomainExceptionMapper.map(
        new CategoryNotFoundException('not found'),
      );
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('maps TagNotFoundException to 404 TAG_NOT_FOUND', () => {
      const result = DomainExceptionMapper.map(
        new TagNotFoundException('not found'),
      );
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.code).toBe('TAG_NOT_FOUND');
    });

    it('maps AssetTypeNotFoundException to 404 ASSET_TYPE_NOT_FOUND', () => {
      const result = DomainExceptionMapper.map(
        new AssetTypeNotFoundException('not found'),
      );
      expect(result.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.code).toBe('ASSET_TYPE_NOT_FOUND');
    });

    it('maps DuplicateNameException to 409 DUPLICATE_NAME', () => {
      const result = DomainExceptionMapper.map(
        new DuplicateNameException('duplicate'),
      );
      expect(result.status).toBe(HttpStatus.CONFLICT);
      expect(result.code).toBe('DUPLICATE_NAME');
    });

    it('maps CategoryHasChildrenException to 409 CATEGORY_HAS_CHILDREN', () => {
      const result = DomainExceptionMapper.map(
        new CategoryHasChildrenException('has children'),
      );
      expect(result.status).toBe(HttpStatus.CONFLICT);
      expect(result.code).toBe('CATEGORY_HAS_CHILDREN');
    });

    it('maps unknown error to 500 INTERNAL_ERROR', () => {
      const result = DomainExceptionMapper.map(new Error('unknown'));
      expect(result.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.code).toBe('INTERNAL_ERROR');
    });
  });
});
