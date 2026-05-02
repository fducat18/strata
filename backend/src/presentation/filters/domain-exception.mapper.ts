import {
  AssetNotFoundException,
  PortfolioSnapshotNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetAlreadyDisposedException,
} from '../../domain/exceptions/index.js';
import { HttpStatus } from '@nestjs/common';

export interface MappedDomainException {
  status: number;
  code: string;
}

/**
 * Maps a domain exception class to its HTTP status + machine-readable code.
 * One method per exception type — pure SRP, easy to extend.
 */
export class DomainExceptionMapper {
  static map(exception: Error): MappedDomainException {
    if (exception instanceof AssetNotFoundException)
      return this.assetNotFound();
    if (exception instanceof PortfolioSnapshotNotFoundException)
      return this.portfolioSnapshotNotFound();
    if (exception instanceof CategoryNotFoundException)
      return this.categoryNotFound();
    if (exception instanceof TagNotFoundException) return this.tagNotFound();
    if (exception instanceof AssetTypeNotFoundException)
      return this.assetTypeNotFound();
    if (exception instanceof DuplicateNameException)
      return this.duplicateName();
    if (exception instanceof CategoryHasChildrenException)
      return this.categoryHasChildren();
    if (exception instanceof AssetAlreadyDisposedException)
      return this.assetAlreadyDisposed();
    return this.unknown();
  }

  private static assetNotFound(): MappedDomainException {
    return { status: HttpStatus.NOT_FOUND, code: 'ASSET_NOT_FOUND' };
  }
  private static portfolioSnapshotNotFound(): MappedDomainException {
    return {
      status: HttpStatus.NOT_FOUND,
      code: 'PORTFOLIO_SNAPSHOT_NOT_FOUND',
    };
  }
  private static categoryNotFound(): MappedDomainException {
    return { status: HttpStatus.NOT_FOUND, code: 'CATEGORY_NOT_FOUND' };
  }
  private static tagNotFound(): MappedDomainException {
    return { status: HttpStatus.NOT_FOUND, code: 'TAG_NOT_FOUND' };
  }
  private static assetTypeNotFound(): MappedDomainException {
    return { status: HttpStatus.NOT_FOUND, code: 'ASSET_TYPE_NOT_FOUND' };
  }
  private static duplicateName(): MappedDomainException {
    return { status: HttpStatus.CONFLICT, code: 'DUPLICATE_NAME' };
  }
  private static categoryHasChildren(): MappedDomainException {
    return { status: HttpStatus.CONFLICT, code: 'CATEGORY_HAS_CHILDREN' };
  }
  private static assetAlreadyDisposed(): MappedDomainException {
    return { status: HttpStatus.CONFLICT, code: 'ASSET_ALREADY_DISPOSED' };
  }
  private static unknown(): MappedDomainException {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
    };
  }
}
