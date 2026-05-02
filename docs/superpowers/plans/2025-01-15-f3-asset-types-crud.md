# F3: Asset Types CRUD Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add POST/PUT/DELETE endpoints for asset types on the backend, and build a `/asset-types` management page on the frontend.

**Architecture:** Backend uses NestJS hexagonal architecture — domain exception → repository port → Prisma repository → service → controller → DTO. Frontend uses React Query hooks over a typed API client, with Astro pages as the shell.

**Tech Stack:** NestJS + Prisma + SQLite (backend); Astro + React + React Query + Tailwind v4 (frontend); Vitest + @testing-library/react (frontend tests); Jest (backend tests).

---

## File Map

### Backend — new files
- Create: `backend/src/presentation/dto/asset-type/create-asset-type.dto.ts`
- Create: `backend/src/presentation/dto/asset-type/update-asset-type.dto.ts`
- Create: `backend/src/presentation/dto/asset-type/index.ts`
- Create: `.bruno/Strata/AssetTypes/CreateAssetType.bru`
- Create: `.bruno/Strata/AssetTypes/UpdateAssetType.bru`
- Create: `.bruno/Strata/AssetTypes/DeleteAssetType.bru`

### Backend — modified files
- Modify: `backend/src/domain/exceptions/domain.exceptions.ts` — add `AssetTypeInUseException`
- Modify: `backend/src/domain/exceptions/index.ts` — export new exception
- Modify: `backend/src/domain/ports/asset-type.repository.port.ts` — add `create`, `update`, `delete`, `countByTypeId`
- Modify: `backend/src/infrastructure/repositories/prisma-asset-type.repository.ts` — implement new methods
- Modify: `backend/src/infrastructure/repositories/prisma-asset-type.repository.spec.ts` — tests for new methods
- Modify: `backend/src/application/services/asset-type.service.ts` — add `create`, `update`, `delete`
- Modify: `backend/src/application/services/asset-type.service.spec.ts` — tests for new service methods
- Modify: `backend/src/presentation/controllers/asset-type.controller.ts` — add POST, PUT, DELETE handlers
- Modify: `backend/src/presentation/controllers/asset-type.controller.spec.ts` — tests for new endpoints
- Modify: `backend/src/presentation/filters/domain-exception.filter.ts` — register `AssetTypeInUseException`
- Modify: `backend/src/presentation/filters/domain-exception.mapper.ts` — map to 409
- Modify: `backend/src/presentation/filters/domain-exception.filter.spec.ts` — test 409 for new exception
- Modify: `backend/src/presentation/dto/index.ts` — export new DTOs

### Frontend — new files
- Create: `front/src/pages/asset-types/index.astro`
- Create: `front/src/components/asset-types/AssetTypesPage.tsx`
- Create: `front/src/components/asset-types/index.tsx`
- Create: `front/src/components/asset-types/__tests__/AssetTypesPage.test.tsx`

### Frontend — modified files
- Modify: `front/src/lib/types/index.ts` — add `group` to `AssetType`, add `CreateAssetTypeRequest`, `UpdateAssetTypeRequest`
- Modify: `front/src/lib/api/assetTypes.ts` — add `create`, `update`, `delete`
- Modify: `front/src/lib/api/__tests__/assetTypes.test.ts` — test new API methods
- Modify: `front/src/lib/hooks/assetTypes.ts` — add mutation hooks
- Modify: `front/src/lib/hooks/__tests__/assetTypes.test.tsx` — test new hooks
- Modify: `front/src/lib/hooks/invalidation.ts` — add `invalidateAssetTypeQueries`
- Modify: `front/src/lib/hooks/index.ts` — export new hooks + invalidation
- Modify: `front/src/components/layout/Sidebar.tsx` — add "Asset Types" nav item

---

## Task 1: Domain exception for AssetTypeInUse

**Files:**
- Modify: `backend/src/domain/exceptions/domain.exceptions.ts`
- Modify: `backend/src/domain/exceptions/index.ts`

- [ ] **Step 1: Add `AssetTypeInUseException` to domain exceptions**

In `backend/src/domain/exceptions/domain.exceptions.ts`, append after `AssetAlreadyDisposedException`:

```typescript
export class AssetTypeInUseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetTypeInUseException';
  }
}
```

- [ ] **Step 2: Export from exceptions index**

In `backend/src/domain/exceptions/index.ts`, add to exports:

```typescript
export class AssetTypeInUseException extends Error {
  // already exported via domain.exceptions — just add the export line
```

Replace the exports block in `backend/src/domain/exceptions/index.ts` — add:
```typescript
export { AssetTypeInUseException } from './domain.exceptions';
```

The current file is:
```typescript
export {
  AssetNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  PortfolioSnapshotNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetAlreadyDisposedException,
} from './domain.exceptions';
```

Change to:
```typescript
export {
  AssetNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  PortfolioSnapshotNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetAlreadyDisposedException,
  AssetTypeInUseException,
} from './domain.exceptions';
```

- [ ] **Step 3: Wire into DomainExceptionFilter**

In `backend/src/presentation/filters/domain-exception.filter.ts`, add `AssetTypeInUseException` to the import and to the `@Catch(...)` decorator:

```typescript
import {
  AssetNotFoundException,
  AssetTypeNotFoundException,
  CategoryHasChildrenException,
  CategoryNotFoundException,
  DuplicateNameException,
  PortfolioSnapshotNotFoundException,
  TagNotFoundException,
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';
```

And update `@Catch(...)`:
```typescript
@Catch(
  AssetNotFoundException,
  PortfolioSnapshotNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
  AssetTypeInUseException,
)
```

- [ ] **Step 4: Wire into DomainExceptionMapper**

In `backend/src/presentation/filters/domain-exception.mapper.ts`, add import and case:

Add to imports:
```typescript
import {
  // existing imports...
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';
```

Add to the `map` method, after the `AssetAlreadyDisposedException` check:
```typescript
if (exception instanceof AssetTypeInUseException)
  return this.assetTypeInUse();
```

Add private method:
```typescript
private static assetTypeInUse(): MappedDomainException {
  return { status: HttpStatus.CONFLICT, code: 'ASSET_TYPE_IN_USE' };
}
```

- [ ] **Step 5: Run backend tests to verify no regressions**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="domain-exception" 2>&1 | tail -20
```

Expected: all existing tests pass.

- [ ] **Step 6: Add test for AssetTypeInUseException → 409**

In `backend/src/presentation/filters/domain-exception.filter.spec.ts`, add after the `CategoryHasChildrenException` test:

```typescript
it('returns 409 for AssetTypeInUseException', () => {
  const host = buildMockHost(responseMock);
  filter.catch(new AssetTypeInUseException('type in use'), host);
  expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  const body = responseMock.json.mock.calls[0][0];
  expect(body.code).toBe('ASSET_TYPE_IN_USE');
  expect(body.error).toBe('Conflict');
});
```

And add to the import:
```typescript
import {
  // existing...
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';
```

- [ ] **Step 7: Run filter tests**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="domain-exception.filter" 2>&1 | tail -20
```

Expected: all tests pass including new one.

- [ ] **Step 8: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add backend/src/domain/exceptions/ backend/src/presentation/filters/ && git commit -m "feat(backend): add AssetTypeInUseException → 409 mapping"
```

---

## Task 2: Repository port — add create/update/delete/countByTypeId

**Files:**
- Modify: `backend/src/domain/ports/asset-type.repository.port.ts`

- [ ] **Step 1: Extend the repository port interface**

Replace the entire content of `backend/src/domain/ports/asset-type.repository.port.ts`:

```typescript
import { AssetType } from '../entities/asset-type.entity';

export interface CreateAssetTypeData {
  code: string;
  label: string;
  group: string;
}

export interface UpdateAssetTypeData {
  label: string;
  group: string;
}

export abstract class IAssetTypeRepository {
  abstract findById(id: string): Promise<AssetType | null>;
  abstract findAll(): Promise<AssetType[]>;
  abstract create(data: CreateAssetTypeData): Promise<AssetType>;
  abstract update(id: string, data: UpdateAssetTypeData): Promise<AssetType>;
  abstract delete(id: string): Promise<void>;
  abstract countByTypeId(assetTypeId: string): Promise<number>;
}
```

- [ ] **Step 2: Export new types from domain ports index**

In `backend/src/domain/ports/index.ts`, the current export for IAssetTypeRepository is:
```typescript
export { IAssetTypeRepository } from './asset-type.repository.port';
```

Update to:
```typescript
export { IAssetTypeRepository } from './asset-type.repository.port';
export type { CreateAssetTypeData, UpdateAssetTypeData } from './asset-type.repository.port';
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add backend/src/domain/ports/ && git commit -m "feat(backend): extend IAssetTypeRepository port with write methods"
```

---

## Task 3: Prisma repository — implement new methods + tests

**Files:**
- Modify: `backend/src/infrastructure/repositories/prisma-asset-type.repository.ts`
- Modify: `backend/src/infrastructure/repositories/prisma-asset-type.repository.spec.ts`

- [ ] **Step 1: Write failing tests first**

Replace the content of `backend/src/infrastructure/repositories/prisma-asset-type.repository.spec.ts` with:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaAssetTypeRepository } from './prisma-asset-type.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('PrismaAssetTypeRepository', () => {
  let repository: PrismaAssetTypeRepository;

  const assetTypeRow = { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' };
  const assetTypeRow2 = { id: 'at2', code: 'CRYPTO', label: 'Crypto', group: 'FINANCIAL' };

  const mockPrismaService = {
    assetType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    asset: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaAssetTypeRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaAssetTypeRepository>(PrismaAssetTypeRepository);
  });

  describe('findById', () => {
    it('returns mapped asset type when found', async () => {
      mockPrismaService.assetType.findUnique.mockResolvedValue(assetTypeRow);
      const result = await repository.findById('at1');
      expect(mockPrismaService.assetType.findUnique).toHaveBeenCalledWith({ where: { id: 'at1' } });
      expect(result?.id).toBe('at1');
      expect(result?.code).toBe('STOCKS');
      expect(result?.label).toBe('Stocks');
      expect(result?.group).toBe('FINANCIAL');
    });

    it('returns null when not found', async () => {
      mockPrismaService.assetType.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all asset types mapped', async () => {
      mockPrismaService.assetType.findMany.mockResolvedValue([assetTypeRow, assetTypeRow2]);
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('STOCKS');
      expect(result[1].code).toBe('CRYPTO');
    });

    it('returns empty array when none found', async () => {
      mockPrismaService.assetType.findMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates and returns mapped asset type', async () => {
      const newRow = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
      mockPrismaService.assetType.create.mockResolvedValue(newRow);
      const result = await repository.create({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
      expect(mockPrismaService.assetType.create).toHaveBeenCalledWith({
        data: { code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' },
      });
      expect(result.id).toBe('at3');
      expect(result.code).toBe('CRYPTO_ETF');
    });
  });

  describe('update', () => {
    it('updates label and group and returns mapped asset type', async () => {
      const updatedRow = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
      mockPrismaService.assetType.update.mockResolvedValue(updatedRow);
      const result = await repository.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
      expect(mockPrismaService.assetType.update).toHaveBeenCalledWith({
        where: { id: 'at1' },
        data: { label: 'Public Stocks', group: 'FINANCIAL' },
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('deletes by id', async () => {
      mockPrismaService.assetType.delete.mockResolvedValue(assetTypeRow);
      await repository.delete('at1');
      expect(mockPrismaService.assetType.delete).toHaveBeenCalledWith({ where: { id: 'at1' } });
    });
  });

  describe('countByTypeId', () => {
    it('returns count of assets using this type', async () => {
      mockPrismaService.asset.count.mockResolvedValue(3);
      const count = await repository.countByTypeId('at1');
      expect(mockPrismaService.asset.count).toHaveBeenCalledWith({ where: { assetTypeId: 'at1' } });
      expect(count).toBe(3);
    });

    it('returns 0 when no assets use this type', async () => {
      mockPrismaService.asset.count.mockResolvedValue(0);
      const count = await repository.countByTypeId('at1');
      expect(count).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="prisma-asset-type.repository" 2>&1 | tail -30
```

Expected: failures on `create`, `update`, `delete`, `countByTypeId` — methods don't exist yet.

- [ ] **Step 3: Implement new repository methods**

Replace the entire content of `backend/src/infrastructure/repositories/prisma-asset-type.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AssetType as AssetTypeModel } from '@prisma/client';
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
      data: { code: data.code, label: data.label, group: data.group },
    });
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateAssetTypeData): Promise<AssetType> {
    const result = await this.prisma.assetType.update({
      where: { id },
      data: { label: data.label, group: data.group },
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="prisma-asset-type.repository" 2>&1 | tail -20
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add backend/src/infrastructure/repositories/prisma-asset-type.repository.ts backend/src/infrastructure/repositories/prisma-asset-type.repository.spec.ts && git commit -m "feat(backend): implement create/update/delete/countByTypeId on PrismaAssetTypeRepository"
```

---

## Task 4: Service — add create/update/delete + tests

**Files:**
- Modify: `backend/src/application/services/asset-type.service.ts`
- Modify: `backend/src/application/services/asset-type.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Replace the content of `backend/src/application/services/asset-type.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypeService } from './asset-type.service.js';
import { IAssetTypeRepository } from '../../domain/ports/index.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';
import {
  AssetTypeNotFoundException,
  AssetTypeInUseException,
} from '../../domain/exceptions/index.js';

describe('AssetTypeService', () => {
  let service: AssetTypeService;

  const mockAssetTypeRepo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByTypeId: jest.fn(),
  };

  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleAssetType2 = new AssetType('at2', 'CRYPTO', 'Crypto', 'FINANCIAL');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetTypeService,
        { provide: IAssetTypeRepository, useValue: mockAssetTypeRepo },
      ],
    }).compile();

    service = module.get<AssetTypeService>(AssetTypeService);
  });

  describe('findById', () => {
    it('throws AssetTypeNotFoundException when not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('returns asset type when found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      const result = await service.findById('at1');
      expect(result).toBe(sampleAssetType);
    });
  });

  describe('findAll', () => {
    it('returns all asset types', async () => {
      mockAssetTypeRepo.findAll.mockResolvedValue([sampleAssetType, sampleAssetType2]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('STOCKS');
    });
  });

  describe('create', () => {
    it('creates and returns new asset type', async () => {
      const newType = new AssetType('at3', 'CRYPTO_ETF', 'Crypto ETF', 'FINANCIAL');
      mockAssetTypeRepo.create.mockResolvedValue(newType);
      const result = await service.create({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
      expect(mockAssetTypeRepo.create).toHaveBeenCalledWith({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL',
      });
      expect(result.code).toBe('CRYPTO_ETF');
    });
  });

  describe('update', () => {
    it('throws AssetTypeNotFoundException when asset type not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('unknown', { label: 'New Label', group: 'FINANCIAL' })
      ).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('updates and returns asset type', async () => {
      const updated = new AssetType('at1', 'STOCKS', 'Public Stocks', 'FINANCIAL');
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.update.mockResolvedValue(updated);
      const result = await service.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
      expect(mockAssetTypeRepo.update).toHaveBeenCalledWith('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL',
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('throws AssetTypeNotFoundException when not found', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(null);
      await expect(service.delete('unknown')).rejects.toThrow(AssetTypeNotFoundException);
    });

    it('throws AssetTypeInUseException when assets reference this type', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.countByTypeId.mockResolvedValue(2);
      await expect(service.delete('at1')).rejects.toThrow(AssetTypeInUseException);
    });

    it('deletes when no assets reference this type', async () => {
      mockAssetTypeRepo.findById.mockResolvedValue(sampleAssetType);
      mockAssetTypeRepo.countByTypeId.mockResolvedValue(0);
      mockAssetTypeRepo.delete.mockResolvedValue(undefined);
      await service.delete('at1');
      expect(mockAssetTypeRepo.delete).toHaveBeenCalledWith('at1');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="asset-type.service" 2>&1 | tail -30
```

Expected: failures on `create`, `update`, `delete` — methods don't exist yet.

- [ ] **Step 3: Implement new service methods**

Replace the entire content of `backend/src/application/services/asset-type.service.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="asset-type.service" 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add backend/src/application/services/asset-type.service.ts backend/src/application/services/asset-type.service.spec.ts && git commit -m "feat(backend): add create/update/delete to AssetTypeService"
```

---

## Task 5: DTOs + controller — add POST, PUT, DELETE

**Files:**
- Create: `backend/src/presentation/dto/asset-type/create-asset-type.dto.ts`
- Create: `backend/src/presentation/dto/asset-type/update-asset-type.dto.ts`
- Create: `backend/src/presentation/dto/asset-type/index.ts`
- Modify: `backend/src/presentation/dto/index.ts`
- Modify: `backend/src/presentation/controllers/asset-type.controller.ts`
- Modify: `backend/src/presentation/controllers/asset-type.controller.spec.ts`

- [ ] **Step 1: Write failing controller tests**

Replace the entire content of `backend/src/presentation/controllers/asset-type.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypeController } from './asset-type.controller.js';
import { AssetTypeService } from '../../application/services/index.js';
import { AssetType } from '../../domain/entities/asset-type.entity.js';

describe('AssetTypeController', () => {
  let controller: AssetTypeController;
  let assetTypeService: jest.Mocked<AssetTypeService>;

  const sampleAssetType = new AssetType('at1', 'STOCKS', 'Stocks', 'FINANCIAL');
  const sampleAssetType2 = new AssetType('at2', 'CRYPTO', 'Crypto', 'FINANCIAL');

  beforeEach(async () => {
    const mockAssetTypeService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetTypeController],
      providers: [
        { provide: AssetTypeService, useValue: mockAssetTypeService },
      ],
    }).compile();

    controller = module.get<AssetTypeController>(AssetTypeController);
    assetTypeService = module.get(AssetTypeService);
  });

  describe('findAll', () => {
    it('returns all asset types mapped to response DTOs', async () => {
      assetTypeService.findAll.mockResolvedValue([sampleAssetType, sampleAssetType2]);
      const result = await controller.findAll();
      expect(assetTypeService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('at1');
      expect(result[0].code).toBe('STOCKS');
      expect(result[0].label).toBe('Stocks');
      expect(result[0].group).toBe('FINANCIAL');
      expect(result[1].id).toBe('at2');
    });
  });

  describe('findById', () => {
    it('returns mapped asset type', async () => {
      assetTypeService.findById.mockResolvedValue(sampleAssetType);
      const result = await controller.findById('at1');
      expect(assetTypeService.findById).toHaveBeenCalledWith('at1');
      expect(result.id).toBe('at1');
      expect(result.code).toBe('STOCKS');
    });
  });

  describe('create', () => {
    it('creates and returns mapped asset type', async () => {
      const newType = new AssetType('at3', 'CRYPTO_ETF', 'Crypto ETF', 'FINANCIAL');
      assetTypeService.create.mockResolvedValue(newType);
      const result = await controller.create({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL',
      });
      expect(assetTypeService.create).toHaveBeenCalledWith({
        code: 'CRYPTO_ETF',
        label: 'Crypto ETF',
        group: 'FINANCIAL',
      });
      expect(result.id).toBe('at3');
      expect(result.code).toBe('CRYPTO_ETF');
      expect(result.group).toBe('FINANCIAL');
    });
  });

  describe('update', () => {
    it('updates and returns mapped asset type', async () => {
      const updated = new AssetType('at1', 'STOCKS', 'Public Stocks', 'FINANCIAL');
      assetTypeService.update.mockResolvedValue(updated);
      const result = await controller.update('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL',
      });
      expect(assetTypeService.update).toHaveBeenCalledWith('at1', {
        label: 'Public Stocks',
        group: 'FINANCIAL',
      });
      expect(result.label).toBe('Public Stocks');
    });
  });

  describe('delete', () => {
    it('calls delete service method', async () => {
      assetTypeService.delete.mockResolvedValue(undefined);
      await controller.delete('at1');
      expect(assetTypeService.delete).toHaveBeenCalledWith('at1');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="asset-type.controller" 2>&1 | tail -30
```

Expected: failures on `create`, `update`, `delete` handler methods not existing yet.

- [ ] **Step 3: Create CreateAssetTypeDto**

Create `backend/src/presentation/dto/asset-type/create-asset-type.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AssetTypeGroup } from '@prisma/client';

export class CreateAssetTypeDto {
  @ApiProperty({ description: 'Unique code for the asset type, e.g. CRYPTO_ETF' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Human-readable label, e.g. Crypto ETF' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: AssetTypeGroup, description: 'Asset type group' })
  @IsEnum(AssetTypeGroup)
  group!: AssetTypeGroup;
}
```

- [ ] **Step 4: Create UpdateAssetTypeDto**

Create `backend/src/presentation/dto/asset-type/update-asset-type.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AssetTypeGroup } from '@prisma/client';

export class UpdateAssetTypeDto {
  @ApiProperty({ description: 'Human-readable label' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ enum: AssetTypeGroup, description: 'Asset type group' })
  @IsEnum(AssetTypeGroup)
  group!: AssetTypeGroup;
}
```

- [ ] **Step 5: Create DTO barrel index**

Create `backend/src/presentation/dto/asset-type/index.ts`:

```typescript
export { CreateAssetTypeDto } from './create-asset-type.dto.js';
export { UpdateAssetTypeDto } from './update-asset-type.dto.js';
```

- [ ] **Step 6: Export DTOs from main DTO index**

In `backend/src/presentation/dto/index.ts`, add:
```typescript
export { CreateAssetTypeDto, UpdateAssetTypeDto } from './asset-type/index.js';
```

The current file ends with:
```typescript
export { IsDecimalString } from './validators/is-decimal-string.validator.js';
```

Add the new line after that.

- [ ] **Step 7: Add POST, PUT, DELETE to controller**

Replace the entire content of `backend/src/presentation/controllers/asset-type.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssetTypeService } from '../../application/services/index.js';
import {
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from '../filters/index.js';
import { AssetTypeFullResponseDto } from '../dto/responses/index.js';
import { CreateAssetTypeDto, UpdateAssetTypeDto } from '../dto/index.js';
import { mapAssetTypeToResponse } from './mappers/asset-type.mapper.js';
import { ApiStandardErrors } from './api-standard-errors.decorator.js';

@ApiTags('Asset Types')
@Controller('api/v1/asset-types')
@UseFilters(PrismaExceptionFilter, DomainExceptionFilter)
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @ApiOperation({ summary: 'List all asset types' })
  @ApiResponse({ status: 200, type: [AssetTypeFullResponseDto] })
  @ApiStandardErrors([500])
  async findAll(): Promise<AssetTypeFullResponseDto[]> {
    const assetTypes = await this.assetTypeService.findAll();
    return assetTypes.map(mapAssetTypeToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset type by ID' })
  @ApiResponse({ status: 200, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([404, 500])
  async findById(@Param('id') id: string): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.findById(id);
    return mapAssetTypeToResponse(assetType);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new asset type' })
  @ApiResponse({ status: 201, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([400, 409, 500])
  async create(@Body() dto: CreateAssetTypeDto): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.create({
      code: dto.code,
      label: dto.label,
      group: dto.group,
    });
    return mapAssetTypeToResponse(assetType);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update asset type label and group' })
  @ApiResponse({ status: 200, type: AssetTypeFullResponseDto })
  @ApiStandardErrors([400, 404, 500])
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetTypeDto,
  ): Promise<AssetTypeFullResponseDto> {
    const assetType = await this.assetTypeService.update(id, {
      label: dto.label,
      group: dto.group,
    });
    return mapAssetTypeToResponse(assetType);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an asset type (fails with 409 if assets use it)' })
  @ApiResponse({ status: 204 })
  @ApiStandardErrors([404, 409, 500])
  async delete(@Param('id') id: string): Promise<void> {
    await this.assetTypeService.delete(id);
  }
}
```

- [ ] **Step 8: Run controller tests**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test -- --testPathPattern="asset-type.controller" 2>&1 | tail -20
```

Expected: all 5 tests pass.

- [ ] **Step 9: Run full backend test suite**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add backend/src/presentation/ && git commit -m "feat(backend): add POST/PUT/DELETE endpoints for asset types"
```

---

## Task 6: Bruno collection — add new endpoint files

**Files:**
- Create: `.bruno/Strata/AssetTypes/CreateAssetType.bru`
- Create: `.bruno/Strata/AssetTypes/UpdateAssetType.bru`
- Create: `.bruno/Strata/AssetTypes/DeleteAssetType.bru`

- [ ] **Step 1: Create CreateAssetType.bru**

Create `.bruno/Strata/AssetTypes/CreateAssetType.bru`:

```
meta {
  name: CreateAssetType
  type: http
  seq: 3
}

post {
  url: http://localhost:3000/api/v1/asset-types
  body: json
  auth: none
}

body:json {
  {
    "code": "CRYPTO_ETF",
    "label": "Crypto ETF",
    "group": "FINANCIAL"
  }
}
```

- [ ] **Step 2: Create UpdateAssetType.bru**

Create `.bruno/Strata/AssetTypes/UpdateAssetType.bru`:

```
meta {
  name: UpdateAssetType
  type: http
  seq: 4
}

put {
  url: http://localhost:3000/api/v1/asset-types/:id
  body: json
  auth: none
}

params:path {
  id: <asset-type-id>
}

body:json {
  {
    "label": "Updated Label",
    "group": "FINANCIAL"
  }
}
```

- [ ] **Step 3: Create DeleteAssetType.bru**

Create `.bruno/Strata/AssetTypes/DeleteAssetType.bru`:

```
meta {
  name: DeleteAssetType
  type: http
  seq: 5
}

delete {
  url: http://localhost:3000/api/v1/asset-types/:id
  body: none
  auth: none
}

params:path {
  id: <asset-type-id>
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add .bruno/ && git commit -m "feat(bruno): add CreateAssetType, UpdateAssetType, DeleteAssetType requests"
```

---

## Task 7: Frontend — update types + API client + tests

**Files:**
- Modify: `front/src/lib/types/index.ts`
- Modify: `front/src/lib/api/assetTypes.ts`
- Modify: `front/src/lib/api/__tests__/assetTypes.test.ts`

- [ ] **Step 1: Write failing API tests**

Replace the content of `front/src/lib/api/__tests__/assetTypes.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { assetTypeApi } from '../assetTypes';
import { api } from '../client';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

describe('assetTypeApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /asset-types', async () => {
    const types = [{ id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' }];
    mockGet.mockResolvedValue({ data: types });
    const result = await assetTypeApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/asset-types');
    expect(result).toEqual(types);
  });

  it('getById calls GET /asset-types/:id', async () => {
    const type = { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' };
    mockGet.mockResolvedValue({ data: type });
    const result = await assetTypeApi.getById('at1');
    expect(mockGet).toHaveBeenCalledWith('/asset-types/at1');
    expect(result).toEqual(type);
  });

  it('create calls POST /asset-types', async () => {
    const newType = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
    mockPost.mockResolvedValue({ data: newType });
    const result = await assetTypeApi.create({
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
    expect(mockPost).toHaveBeenCalledWith('/asset-types', {
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
    expect(result).toEqual(newType);
  });

  it('update calls PUT /asset-types/:id', async () => {
    const updated = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
    mockPut.mockResolvedValue({ data: updated });
    const result = await assetTypeApi.update('at1', { label: 'Public Stocks', group: 'FINANCIAL' });
    expect(mockPut).toHaveBeenCalledWith('/asset-types/at1', {
      label: 'Public Stocks',
      group: 'FINANCIAL',
    });
    expect(result).toEqual(updated);
  });

  it('delete calls DELETE /asset-types/:id', async () => {
    mockDelete.mockResolvedValue({ data: undefined });
    await assetTypeApi.delete('at1');
    expect(mockDelete).toHaveBeenCalledWith('/asset-types/at1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/lib/api/__tests__/assetTypes.test.ts 2>&1 | tail -20
```

Expected: failures on `create`, `update`, `delete` — methods don't exist yet.

- [ ] **Step 3: Add `group` to AssetType interface and add request types**

In `front/src/lib/types/index.ts`, update the `AssetType` interface:

```typescript
export interface AssetType {
  id: string;
  code: string;
  label: string;
  group: string;
}
```

And add these new request interfaces after `CreateTagRequest`:

```typescript
export interface CreateAssetTypeRequest {
  code: string;
  label: string;
  group: string;
}

export interface UpdateAssetTypeRequest {
  label: string;
  group: string;
}
```

- [ ] **Step 4: Add create/update/delete to assetTypes API client**

Replace the entire content of `front/src/lib/api/assetTypes.ts`:

```typescript
import { api } from './client';
import type { AssetType, CreateAssetTypeRequest, UpdateAssetTypeRequest } from '../types';

export const assetTypeApi = {
  getAll: () => api.get<AssetType[]>('/asset-types').then((r) => r.data),
  getById: (id: string) => api.get<AssetType>(`/asset-types/${id}`).then((r) => r.data),
  create: (data: CreateAssetTypeRequest) =>
    api.post<AssetType>('/asset-types', data).then((r) => r.data),
  update: (id: string, data: UpdateAssetTypeRequest) =>
    api.put<AssetType>(`/asset-types/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/asset-types/${id}`).then((r) => r.data),
};
```

- [ ] **Step 5: Run API tests to verify they pass**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/lib/api/__tests__/assetTypes.test.ts 2>&1 | tail -20
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add front/src/lib/types/ front/src/lib/api/assetTypes.ts front/src/lib/api/__tests__/assetTypes.test.ts && git commit -m "feat(frontend): add group to AssetType type and add create/update/delete API methods"
```

---

## Task 8: Frontend — React Query hooks + invalidation + tests

**Files:**
- Modify: `front/src/lib/hooks/invalidation.ts`
- Modify: `front/src/lib/hooks/assetTypes.ts`
- Modify: `front/src/lib/hooks/index.ts`
- Modify: `front/src/lib/hooks/__tests__/assetTypes.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Replace the content of `front/src/lib/hooks/__tests__/assetTypes.test.tsx`:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  assetTypeApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '../assetTypes';
import { assetTypeApi } from '@/lib/api';

const mockAssetTypeApi = vi.mocked(assetTypeApi);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useAssetTypes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches all asset types', async () => {
    const types = [
      { id: 'at1', code: 'STOCKS', label: 'Stocks', group: 'FINANCIAL' },
      { id: 'at2', code: 'CRYPTO', label: 'Crypto', group: 'FINANCIAL' },
    ];
    mockAssetTypeApi.getAll.mockResolvedValue(types);
    const { result } = renderHook(() => useAssetTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(types);
  });
});

describe('useCreateAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.create with data', async () => {
    const newType = { id: 'at3', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' };
    mockAssetTypeApi.create.mockResolvedValue(newType);
    mockAssetTypeApi.getAll.mockResolvedValue([newType]);
    const { result } = renderHook(() => useCreateAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
    expect(mockAssetTypeApi.create).toHaveBeenCalledWith({
      code: 'CRYPTO_ETF',
      label: 'Crypto ETF',
      group: 'FINANCIAL',
    });
  });
});

describe('useUpdateAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.update with id and data', async () => {
    const updated = { id: 'at1', code: 'STOCKS', label: 'Public Stocks', group: 'FINANCIAL' };
    mockAssetTypeApi.update.mockResolvedValue(updated);
    mockAssetTypeApi.getAll.mockResolvedValue([updated]);
    const { result } = renderHook(() => useUpdateAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: 'at1', label: 'Public Stocks', group: 'FINANCIAL' });
    expect(mockAssetTypeApi.update).toHaveBeenCalledWith('at1', {
      label: 'Public Stocks',
      group: 'FINANCIAL',
    });
  });
});

describe('useDeleteAssetType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls assetTypeApi.delete with id', async () => {
    mockAssetTypeApi.delete.mockResolvedValue(undefined);
    mockAssetTypeApi.getAll.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteAssetType(), { wrapper: createWrapper() });
    await result.current.mutateAsync('at1');
    expect(mockAssetTypeApi.delete).toHaveBeenCalledWith('at1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/lib/hooks/__tests__/assetTypes.test.tsx 2>&1 | tail -20
```

Expected: failures on `useCreateAssetType`, `useUpdateAssetType`, `useDeleteAssetType` not found.

- [ ] **Step 3: Add `invalidateAssetTypeQueries` to invalidation.ts**

In `front/src/lib/hooks/invalidation.ts`, append:

```typescript
export function invalidateAssetTypeQueries(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: queryKeys.assetTypes });
}
```

- [ ] **Step 4: Add mutation hooks to assetTypes.ts**

Replace the entire content of `front/src/lib/hooks/assetTypes.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetTypeApi } from '../api';
import { queryKeys } from './queryKeys';
import { invalidateAssetTypeQueries } from './invalidation';
import type { CreateAssetTypeRequest, UpdateAssetTypeRequest } from '../types';

export function useAssetTypes() {
  return useQuery({ queryKey: queryKeys.assetTypes, queryFn: assetTypeApi.getAll });
}

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetTypeRequest) => assetTypeApi.create(data),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}

export function useUpdateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateAssetTypeRequest) =>
      assetTypeApi.update(id, data),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}

export function useDeleteAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetTypeApi.delete(id),
    onSuccess: () => invalidateAssetTypeQueries(qc),
  });
}
```

- [ ] **Step 5: Export new hooks + invalidation from index**

In `front/src/lib/hooks/index.ts`, add to exports:

```typescript
export { invalidateAssetTypeQueries } from './invalidation';
```

Current export for invalidation:
```typescript
export {
  invalidateAssetQueries,
  invalidateCategoryQueries,
  invalidateTagQueries,
} from './invalidation';
```

Update to:
```typescript
export {
  invalidateAssetQueries,
  invalidateCategoryQueries,
  invalidateTagQueries,
  invalidateAssetTypeQueries,
} from './invalidation';
```

- [ ] **Step 6: Run hook tests**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/lib/hooks/__tests__/assetTypes.test.tsx 2>&1 | tail -20
```

Expected: all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add front/src/lib/hooks/ && git commit -m "feat(frontend): add useCreateAssetType/useUpdateAssetType/useDeleteAssetType hooks"
```

---

## Task 9: Frontend — AssetTypesPage component + tests

**Files:**
- Create: `front/src/components/asset-types/AssetTypesPage.tsx`
- Create: `front/src/components/asset-types/index.tsx`
- Create: `front/src/components/asset-types/__tests__/AssetTypesPage.test.tsx`

The `AssetTypeGroup` values and their badge colors:
- `FINANCIAL` → blue: `bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
- `REAL_ESTATE` → green: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
- `PERSONAL_PROPERTY` → orange: `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`
- `PHYSICAL_COLLECTIONS` → purple: `bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`
- `LIABILITIES` → red: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
- `OTHER` → grey: `bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400`

- [ ] **Step 1: Write failing component tests**

Create `front/src/components/asset-types/__tests__/AssetTypesPage.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useAssetTypes: vi.fn(),
  useCreateAssetType: vi.fn(),
  useUpdateAssetType: vi.fn(),
  useDeleteAssetType: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { AssetTypesPage } from '../AssetTypesPage';
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '@/lib/hooks';

const mockUseAssetTypes = vi.mocked(useAssetTypes);
const mockUseCreateAssetType = vi.mocked(useCreateAssetType);
const mockUseUpdateAssetType = vi.mocked(useUpdateAssetType);
const mockUseDeleteAssetType = vi.mocked(useDeleteAssetType);

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const sampleTypes = [
  { id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
  { id: 'at2', code: 'REAL_ESTATE', label: 'Real Estate', group: 'REAL_ESTATE' },
  { id: 'at3', code: 'VEHICLE', label: 'Vehicle', group: 'PERSONAL_PROPERTY' },
];

describe('AssetTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateAssetType.mockReturnValue(mockMutation as any);
    mockUseUpdateAssetType.mockReturnValue(mockMutation as any);
    mockUseDeleteAssetType.mockReturnValue(mockMutation as any);
  });

  it('shows loading when fetching', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(screen.getByText('Could not load asset types')).toBeInTheDocument();
  });

  it('renders asset types with code, label, and group badge', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(screen.getByText('CHECKING_ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('FINANCIAL')).toBeInTheDocument();
    expect(screen.getByText('REAL_ESTATE')).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
  });

  it('opens create dialog when Add new type is clicked', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));
    expect(screen.getByRole('heading', { name: 'Create Asset Type' })).toBeInTheDocument();
  });

  it('closes create dialog on cancel', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('heading', { name: 'Create Asset Type' })).not.toBeInTheDocument();
  });

  it('creates an asset type on valid submit', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'at10', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));

    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'CRYPTO_ETF' } });
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Crypto ETF' } });

    await waitFor(() => {
      const createBtn = screen.getByText('Create');
      expect(createBtn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CRYPTO_ETF', label: 'Crypto ETF' })
      );
    });
  });

  it('deletes an asset type when confirmed', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AssetTypesPage />);
    const deleteBtn = screen.getByLabelText('Delete asset type CHECKING_ACCOUNT');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith('at1');
    });
  });

  it('opens edit dialog when edit button is clicked', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    const editBtn = screen.getByLabelText('Edit asset type CHECKING_ACCOUNT');
    fireEvent.click(editBtn);
    expect(screen.getByRole('heading', { name: 'Edit Asset Type' })).toBeInTheDocument();
  });

  it('updates an asset type on valid edit submit', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking', group: 'FINANCIAL' });
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByLabelText('Edit asset type CHECKING_ACCOUNT'));

    const labelInput = screen.getByLabelText('Label');
    fireEvent.change(labelInput, { target: { value: 'Checking' } });

    await waitFor(() => {
      expect(screen.getByText('Save')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'at1', label: 'Checking' })
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/components/asset-types/__tests__/AssetTypesPage.test.tsx 2>&1 | tail -20
```

Expected: component file not found / all tests fail.

- [ ] **Step 3: Create the AssetTypesPage component**

Create `front/src/components/asset-types/AssetTypesPage.tsx`:

```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '@/lib/hooks';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Loading,
  EmptyState,
} from '@/components/ui';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import type { AssetType } from '@/lib/types';

const GROUP_COLORS: Record<string, string> = {
  FINANCIAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REAL_ESTATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PERSONAL_PROPERTY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PHYSICAL_COLLECTIONS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LIABILITIES: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
};

const GROUPS = Object.keys(GROUP_COLORS);

const createSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).regex(/^[A-Z0-9_]+$/, 'Use uppercase letters, digits, underscores only'),
  label: z.string().min(1, 'Label is required').max(100),
  group: z.enum(['FINANCIAL', 'REAL_ESTATE', 'PERSONAL_PROPERTY', 'PHYSICAL_COLLECTIONS', 'LIABILITIES', 'OTHER']),
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100),
  group: z.enum(['FINANCIAL', 'REAL_ESTATE', 'PERSONAL_PROPERTY', 'PHYSICAL_COLLECTIONS', 'LIABILITIES', 'OTHER']),
});
type EditFormData = z.infer<typeof editSchema>;

export function AssetTypesPage() {
  const { data: assetTypes, isLoading, isError, refetch } = useAssetTypes();
  const createMutation = useCreateAssetType();
  const updateMutation = useUpdateAssetType();
  const deleteMutation = useDeleteAssetType();

  const [showCreate, setShowCreate] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    mode: 'onChange',
    defaultValues: { group: 'FINANCIAL' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
  });

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <EmptyState
        title="Could not load asset types"
        description="There was a problem fetching asset types."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const handleCreate = createForm.handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      createForm.reset();
      setShowCreate(false);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editingType) return;
    try {
      await updateMutation.mutateAsync({ id: editingType.id, ...data });
      setEditingType(null);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  });

  const handleDelete = async (type: AssetType) => {
    if (!confirm(`Delete asset type "${type.label}"? This will fail if any assets use this type.`)) return;
    try {
      await deleteMutation.mutateAsync(type.id);
    } catch (err: unknown) {
      const message = (err as any)?.message ?? 'An unexpected error occurred';
      useUIStore.getState().pushToast({ variant: 'error', message });
    }
  };

  const openEdit = (type: AssetType) => {
    editForm.reset({ label: type.label, group: type.group as EditFormData['group'] });
    setEditingType(type);
  };

  const handleCloseCreate = () => {
    createForm.reset();
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Types</h1>
          <p className="text-muted-foreground">Manage asset type definitions and group assignments.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add new type
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {assetTypes && assetTypes.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-6 font-medium">Code</th>
                  <th className="pb-3 pr-6 font-medium">Label</th>
                  <th className="pb-3 pr-6 font-medium">Group</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assetTypes.map((type) => (
                  <tr key={type.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-3 pr-6 font-mono text-xs font-medium text-muted-foreground">{type.code}</td>
                    <td className="py-3 pr-6 font-medium">{type.label}</td>
                    <td className="py-3 pr-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${GROUP_COLORS[type.group] ?? GROUP_COLORS.OTHER}`}>
                        {type.group}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(type)}
                          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          aria-label={`Edit asset type ${type.code}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label={`Delete asset type ${type.code}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={<Layers className="h-12 w-12" />}
              title="No asset types"
              description="Create asset types to categorize your assets."
              action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add new type</Button>}
            />
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={handleCloseCreate}>
        <DialogHeader>
          <DialogTitle>Create Asset Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="at-code" className="text-sm font-medium">Code</label>
            <Input
              id="at-code"
              {...createForm.register('code')}
              placeholder="e.g. CRYPTO_ETF"
              className="mt-1 font-mono"
              aria-label="Code"
            />
            {createForm.formState.errors.code && (
              <p role="alert" className="text-sm text-destructive mt-1">{createForm.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="at-label" className="text-sm font-medium">Label</label>
            <Input
              id="at-label"
              {...createForm.register('label')}
              placeholder="e.g. Crypto ETF"
              className="mt-1"
              aria-label="Label"
            />
            {createForm.formState.errors.label && (
              <p role="alert" className="text-sm text-destructive mt-1">{createForm.formState.errors.label.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="at-group" className="text-sm font-medium">Group</label>
            <select
              id="at-group"
              {...createForm.register('group')}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Group"
            >
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseCreate}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!createForm.formState.isValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingType} onClose={() => setEditingType(null)}>
        <DialogHeader>
          <DialogTitle>Edit Asset Type</DialogTitle>
        </DialogHeader>
        {editingType && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Code: <span className="font-mono font-medium text-foreground">{editingType.code}</span></p>
            </div>
            <div>
              <label htmlFor="edit-label" className="text-sm font-medium">Label</label>
              <Input
                id="edit-label"
                {...editForm.register('label')}
                className="mt-1"
                aria-label="Label"
              />
              {editForm.formState.errors.label && (
                <p role="alert" className="text-sm text-destructive mt-1">{editForm.formState.errors.label.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="edit-group" className="text-sm font-medium">Group</label>
              <select
                id="edit-group"
                {...editForm.register('group')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                aria-label="Group"
              >
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            disabled={!editForm.formState.isValid || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Create component barrel index**

Create `front/src/components/asset-types/index.tsx`:

```typescript
export { AssetTypesPage } from './AssetTypesPage';
```

- [ ] **Step 5: Run component tests**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/components/asset-types/__tests__/AssetTypesPage.test.tsx 2>&1 | tail -30
```

Expected: all 8 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add front/src/components/asset-types/ && git commit -m "feat(frontend): add AssetTypesPage component with create/edit/delete"
```

---

## Task 10: Frontend — Astro page + nav item

**Files:**
- Create: `front/src/pages/asset-types/index.astro`
- Modify: `front/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create the Astro page**

Create `front/src/pages/asset-types/index.astro` (following the same pattern as `front/src/pages/tags/index.astro`):

```astro
---
import MainLayout from '../../layouts/MainLayout.astro';
import { AssetTypesPage } from '../../components/asset-types';
---

<MainLayout title="Asset Types">
  <AssetTypesPage client:load />
</MainLayout>
```

- [ ] **Step 2: Add Asset Types to the sidebar navigation**

In `front/src/components/layout/Sidebar.tsx`, update the imports to add `Layers`:

```typescript
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
```

And update `navItems` to add Asset Types between Tags and Settings:

```typescript
const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Assets', href: '/assets', icon: Package },
  { label: 'Categories', href: '/categories', icon: FolderTree },
  { label: 'Tags', href: '/tags', icon: Tags },
  { label: 'Asset Types', href: '/asset-types', icon: Layers },
  { label: 'Settings', href: '/settings', icon: Settings },
];
```

- [ ] **Step 3: Update Sidebar tests if they check navItems**

Check `front/src/components/layout/__tests__/Sidebar.test.tsx` — if it asserts the nav links by label, add the new entry. View the file:

```bash
cat /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front/src/components/layout/__tests__/Sidebar.test.tsx
```

If it has a test like `expect(screen.getByText('Tags')).toBeInTheDocument()`, also add `expect(screen.getByText('Asset Types')).toBeInTheDocument()`.

- [ ] **Step 4: Run sidebar + full frontend tests**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test -- src/components/layout/__tests__/Sidebar.test.tsx 2>&1 | tail -20
```

Expected: pass.

- [ ] **Step 5: Run full frontend test suite**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git add front/src/pages/asset-types/ front/src/components/layout/Sidebar.tsx && git commit -m "feat(frontend): add /asset-types Astro page and sidebar nav link"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full backend test suite**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/backend && npm test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 2: Run full frontend test suite**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata/front && npm test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 3: Final commit if there are any pending changes**

```bash
cd /Users/mac-FDUCAT18/Workspace/FDUCAT/strata && git status
```

If there are uncommitted changes, commit them.

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|-------------|------|
| `GET /api/v1/asset-types` returns types with `group` field | Already exists; group already in response DTO |
| `POST /api/v1/asset-types` creates a new type | Tasks 2-5 |
| `PUT /api/v1/asset-types/:id` updates label + group | Tasks 2-5 |
| `DELETE /api/v1/asset-types/:id` returns 409 if assets use it | Tasks 1, 2-5 |
| `/asset-types` page lists all types with group badges | Tasks 9-10 |
| Edit and delete work from the page | Task 9 |
| Tests pass | Task 11 |
| Bruno collection files | Task 6 |

All requirements covered. ✅

### Potential issues

- The `AssetTypeGroup` enum comes from `@prisma/client` — DTOs import it directly. This works for validation but ties presentation to Prisma. Acceptable for this codebase style (same pattern as other DTOs use Prisma types).
- `useUpdateAssetType` spreads `{ id, ...data }` — destructuring is clean and matches the tag hook pattern.
- The sidebar test file needs to be checked in Task 10 Step 3 before assuming it needs no changes.
