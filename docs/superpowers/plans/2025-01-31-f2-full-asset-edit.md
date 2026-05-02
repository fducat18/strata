# F2: Full Asset Edit Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `PUT /api/v1/assets/:id` and the frontend edit form to support name, type, quantity, categories, tags, and acquisition date editing.

**Architecture:** Extend `UpdateAssetData` port + DTO → add `replaceCategories`/`replaceTags` to asset repo + `updateOccurredAt` to transaction repo + `findEarliestByAsset`/`updateObservedAt` to snapshot repo → extend `AssetService.update()` → expand frontend form.

**Tech Stack:** NestJS + Prisma + SQLite (backend), React + TypeScript (frontend), Jest (backend tests), Vitest (frontend tests).

---

### Task 1: Extend backend ports (types/interfaces)

**Files:**
- Modify: `backend/src/domain/ports/asset.repository.port.ts`
- Modify: `backend/src/domain/ports/transaction.repository.port.ts`
- Modify: `backend/src/domain/ports/asset-snapshot.repository.port.ts`
- Modify: `backend/src/presentation/dto/asset/update-asset.dto.ts`

- [ ] **Step 1: Extend UpdateAssetData and IAssetRepository**

Edit `backend/src/domain/ports/asset.repository.port.ts`:
```typescript
import { Asset } from '../entities/asset.entity';

export interface CreateAssetData {
  name: string;
  assetTypeId: string;
  quantity?: string;
  acquisitionDate: string;
  acquisitionPrice: string;
}

export interface UpdateAssetData {
  name?: string;
  quantity?: string;
  assetTypeId?: string;
  disposed?: boolean;
  categoryIds?: string[];
  tagIds?: string[];
}

export abstract class IAssetRepository {
  abstract save(data: CreateAssetData): Promise<Asset>;
  abstract findById(id: string): Promise<Asset | null>;
  abstract findAll(): Promise<Asset[]>;
  abstract update(id: string, data: UpdateAssetData): Promise<Asset>;
  abstract delete(id: string): Promise<void>;
  abstract dispose(id: string): Promise<Asset>;
  abstract addCategory(assetId: string, categoryId: string): Promise<Asset>;
  abstract removeCategory(assetId: string, categoryId: string): Promise<void>;
  abstract addTag(assetId: string, tagId: string): Promise<Asset>;
  abstract removeTag(assetId: string, tagId: string): Promise<void>;
  abstract replaceCategories(assetId: string, categoryIds: string[]): Promise<Asset>;
  abstract replaceTags(assetId: string, tagIds: string[]): Promise<Asset>;
}
```

- [ ] **Step 2: Add updateOccurredAt to ITransactionRepository**

Edit `backend/src/domain/ports/transaction.repository.port.ts`:
```typescript
import { Transaction } from '../entities/transaction.entity.js';

export interface CreateTransactionData {
  assetId: string;
  type: 'ACQUIRE' | 'DISPOSE' | 'ADJUST';
  unitPrice: string;
  quantity: string;
  currency: string;
  occurredAt: Date;
}

export abstract class ITransactionRepository {
  abstract save(data: CreateTransactionData): Promise<Transaction>;
  abstract findByAssetAndType(assetId: string, type: string): Promise<Transaction | null>;
  abstract updateOccurredAt(id: string, occurredAt: Date): Promise<Transaction>;
}
```

- [ ] **Step 3: Add findEarliestByAsset and updateObservedAt to IAssetSnapshotRepository**

Edit `backend/src/domain/ports/asset-snapshot.repository.port.ts`:
```typescript
import { AssetSnapshot } from '../entities/asset-snapshot.entity';

export interface CreateAssetSnapshotData {
  assetId: string;
  value: string;
  observedAt: Date;
}

export abstract class IAssetSnapshotRepository {
  abstract save(data: CreateAssetSnapshotData): Promise<AssetSnapshot>;
  abstract findByAsset(assetId: string): Promise<AssetSnapshot[]>;
  abstract findLatestByAsset(assetId: string): Promise<AssetSnapshot | null>;
  abstract findLatestPerNonDisposedAsset(): Promise<AssetSnapshot[]>;
  abstract findLatestPerNonDisposedAssetAsOf(beforeDate: Date): Promise<AssetSnapshot[]>;
  abstract findEarliestByAsset(assetId: string): Promise<AssetSnapshot | null>;
  abstract updateObservedAt(id: string, observedAt: Date): Promise<AssetSnapshot>;
}
```

- [ ] **Step 4: Extend UpdateAssetDto**

Edit `backend/src/presentation/dto/asset/update-asset.dto.ts`:
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, IsDateString } from 'class-validator';
import { IsDecimalString } from '../validators/is-decimal-string.validator.js';

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Quantity as decimal string (max 8 fractional digits)',
  })
  @IsOptional()
  @IsDecimalString({ maxFractionDigits: 8 })
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetTypeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/ports/asset.repository.port.ts \
        backend/src/domain/ports/transaction.repository.port.ts \
        backend/src/domain/ports/asset-snapshot.repository.port.ts \
        backend/src/presentation/dto/asset/update-asset.dto.ts
git commit -m "feat(F2): extend ports and DTO for full asset update"
```

---

### Task 2: Implement new repository methods

**Files:**
- Modify: `backend/src/infrastructure/repositories/prisma-asset.repository.ts`
- Modify: `backend/src/infrastructure/repositories/prisma-transaction.repository.ts`
- Modify: `backend/src/infrastructure/repositories/prisma-asset-snapshot.repository.ts`

- [ ] **Step 1: Add replaceCategories and replaceTags to PrismaAssetRepository**

In `prisma-asset.repository.ts`, add after `removeTag`:
```typescript
async replaceCategories(assetId: string, categoryIds: string[]): Promise<Asset> {
  return this.prisma.$transaction(async (tx) => {
    await tx.categoriesOnAssets.deleteMany({ where: { assetId } });
    if (categoryIds.length > 0) {
      await tx.categoriesOnAssets.createMany({
        data: categoryIds.map((categoryId) => ({ assetId, categoryId })),
      });
    }
    return this.reloadAsset(tx, assetId);
  });
}

async replaceTags(assetId: string, tagIds: string[]): Promise<Asset> {
  return this.prisma.$transaction(async (tx) => {
    await tx.tagsOnAssets.deleteMany({ where: { assetId } });
    if (tagIds.length > 0) {
      await tx.tagsOnAssets.createMany({
        data: tagIds.map((tagId) => ({ assetId, tagId })),
      });
    }
    return this.reloadAsset(tx, assetId);
  });
}
```

- [ ] **Step 2: Add updateOccurredAt to PrismaTransactionRepository**

In `prisma-transaction.repository.ts`, add:
```typescript
async updateOccurredAt(id: string, occurredAt: Date): Promise<Transaction> {
  const result = await this.prisma.transaction.update({
    where: { id },
    data: { occurredAt },
  });
  return this.mapToEntity(result);
}
```

- [ ] **Step 3: Add findEarliestByAsset and updateObservedAt to PrismaAssetSnapshotRepository**

In `prisma-asset-snapshot.repository.ts`, add:
```typescript
async findEarliestByAsset(assetId: string): Promise<AssetSnapshot | null> {
  const result = await this.prisma.assetSnapshot.findFirst({
    where: { assetId },
    orderBy: { observedAt: 'asc' },
  });
  return result ? this.mapToEntity(result) : null;
}

async updateObservedAt(id: string, observedAt: Date): Promise<AssetSnapshot> {
  const result = await this.prisma.assetSnapshot.update({
    where: { id },
    data: { observedAt },
  });
  return this.mapToEntity(result);
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/infrastructure/repositories/prisma-asset.repository.ts \
        backend/src/infrastructure/repositories/prisma-transaction.repository.ts \
        backend/src/infrastructure/repositories/prisma-asset-snapshot.repository.ts
git commit -m "feat(F2): implement replaceCategories, replaceTags, updateOccurredAt, findEarliestByAsset, updateObservedAt"
```

---

### Task 3: Extend AssetService.update()

**Files:**
- Modify: `backend/src/application/services/asset.service.ts`

- [ ] **Step 1: Import IAssetSnapshotRepository and extend update()**

Replace the `update()` method in `asset.service.ts`:
```typescript
async update(id: string, data: UpdateAssetData & { acquisitionDate?: string }): Promise<Asset> {
  await this.findById(id);

  if (data.assetTypeId) {
    const assetType = await this.assetTypeRepository.findById(data.assetTypeId);
    if (!assetType)
      throw new AssetTypeNotFoundException(`Asset type ${data.assetTypeId} not found`);
  }

  const assetData: UpdateAssetData = {};
  if (data.name !== undefined) assetData.name = data.name;
  if (data.quantity !== undefined) assetData.quantity = data.quantity;
  if (data.assetTypeId !== undefined) assetData.assetTypeId = data.assetTypeId;

  if (Object.keys(assetData).length > 0) {
    await this.assetRepository.update(id, assetData);
  }

  if (data.categoryIds !== undefined) {
    await this.assetRepository.replaceCategories(id, data.categoryIds);
  }

  if (data.tagIds !== undefined) {
    await this.assetRepository.replaceTags(id, data.tagIds);
  }

  if (data.acquisitionDate !== undefined) {
    const acquireTransaction = await this.transactionRepository.findByAssetAndType(id, 'ACQUIRE');
    if (acquireTransaction) {
      const newDate = new Date(data.acquisitionDate);
      const oldDate = acquireTransaction.occurredAt;
      const minDate = newDate < oldDate ? newDate : oldDate;

      await this.transactionRepository.updateOccurredAt(acquireTransaction.id, newDate);

      const earliestSnapshot = await this.assetSnapshotRepository.findEarliestByAsset(id);
      if (earliestSnapshot) {
        await this.assetSnapshotRepository.updateObservedAt(earliestSnapshot.id, newDate);
      }

      await this.portfolioSnapshotService.recalculateFromDate(minDate);
    }
  }

  return this.assetRepository.findById(id) as Promise<Asset>;
}
```

Also inject `IAssetSnapshotRepository` into the constructor:
```typescript
constructor(
  private readonly assetRepository: IAssetRepository,
  private readonly assetTypeRepository: IAssetTypeRepository,
  private readonly tagRepository: ITagRepository,
  private readonly categoryRepository: ICategoryRepository,
  private readonly transactionRepository: ITransactionRepository,
  private readonly assetSnapshotRepository: IAssetSnapshotRepository,
  private readonly assetSnapshotService: AssetSnapshotService,
  private readonly portfolioSnapshotService: PortfolioSnapshotService,
) {}
```

And import `IAssetSnapshotRepository` at the top.

- [ ] **Step 2: Commit**

```bash
git add backend/src/application/services/asset.service.ts
git commit -m "feat(F2): extend AssetService.update() for categories, tags, acquisitionDate"
```

---

### Task 4: Backend tests

**Files:**
- Modify: `backend/src/application/services/asset.service.spec.ts`
- Modify: `backend/src/infrastructure/repositories/prisma-asset.repository.spec.ts`

- [ ] **Step 1: Update asset.service.spec.ts**

Add `mockAssetSnapshotRepo` to the mock setup and add tests for the new update behaviors. Also add `replaceCategories` and `replaceTags` to `mockAssetRepo`.

Add to mock setup:
```typescript
const mockAssetRepo = {
  // ... existing mocks ...
  replaceCategories: jest.fn(),
  replaceTags: jest.fn(),
};

const mockAssetSnapshotRepo = {
  save: jest.fn(),
  findByAsset: jest.fn(),
  findLatestByAsset: jest.fn(),
  findLatestPerNonDisposedAsset: jest.fn(),
  findLatestPerNonDisposedAssetAsOf: jest.fn(),
  findEarliestByAsset: jest.fn(),
  updateObservedAt: jest.fn(),
};
```

Add to providers in TestingModule:
```typescript
{ provide: IAssetSnapshotRepository, useValue: mockAssetSnapshotRepo },
```

Import `IAssetSnapshotRepository`:
```typescript
import { IAssetSnapshotRepository } from '../../domain/ports/asset-snapshot.repository.port.js';
```

Add test cases for update:
```typescript
it('calls replaceCategories when categoryIds provided', async () => {
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  mockAssetRepo.replaceCategories.mockResolvedValue(sampleAsset);
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  await service.update('a1', { categoryIds: ['c1', 'c2'] });
  expect(mockAssetRepo.replaceCategories).toHaveBeenCalledWith('a1', ['c1', 'c2']);
});

it('calls replaceTags when tagIds provided', async () => {
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  mockAssetRepo.replaceTags.mockResolvedValue(sampleAsset);
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  await service.update('a1', { tagIds: ['t1'] });
  expect(mockAssetRepo.replaceTags).toHaveBeenCalledWith('a1', ['t1']);
});

it('updates ACQUIRE transaction and snapshot when acquisitionDate provided', async () => {
  const acquireTx = { id: 'tx1', occurredAt: new Date('2025-01-10') };
  const snapshot = { id: 'snap1', observedAt: new Date('2025-01-10') };
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  mockTransactionRepo.findByAssetAndType.mockResolvedValue(acquireTx);
  mockTransactionRepo.updateOccurredAt.mockResolvedValue({});
  mockAssetSnapshotRepo.findEarliestByAsset.mockResolvedValue(snapshot);
  mockAssetSnapshotRepo.updateObservedAt.mockResolvedValue({});
  mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);

  await service.update('a1', { acquisitionDate: '2025-01-15' });

  expect(mockTransactionRepo.updateOccurredAt).toHaveBeenCalledWith('tx1', new Date('2025-01-15'));
  expect(mockAssetSnapshotRepo.updateObservedAt).toHaveBeenCalledWith('snap1', new Date('2025-01-15'));
  expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(new Date('2025-01-10'));
});

it('uses min(old, new) date for recalculation when new date is earlier', async () => {
  const acquireTx = { id: 'tx1', occurredAt: new Date('2025-01-15') };
  const snapshot = { id: 'snap1' };
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);
  mockTransactionRepo.findByAssetAndType.mockResolvedValue(acquireTx);
  mockTransactionRepo.updateOccurredAt.mockResolvedValue({});
  mockAssetSnapshotRepo.findEarliestByAsset.mockResolvedValue(snapshot);
  mockAssetSnapshotRepo.updateObservedAt.mockResolvedValue({});
  mockPortfolioSnapshotService.recalculateFromDate.mockResolvedValue(undefined);
  mockAssetRepo.findById.mockResolvedValue(sampleAsset);

  await service.update('a1', { acquisitionDate: '2025-01-01' });

  expect(mockPortfolioSnapshotService.recalculateFromDate).toHaveBeenCalledWith(new Date('2025-01-01'));
});
```

- [ ] **Step 2: Run backend tests**

```bash
cd backend && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add backend/src/application/services/asset.service.spec.ts
git commit -m "test(F2): add tests for extended update() behavior"
```

---

### Task 5: Frontend — Type updates

**Files:**
- Modify: `front/src/lib/types/index.ts`

- [ ] **Step 1: Add Transaction type and update Asset and UpdateAssetRequest**

Edit `front/src/lib/types/index.ts`:
```typescript
export interface Transaction {
  id: string;
  assetId: string;
  type: 'ACQUIRE' | 'DISPOSE' | 'ADJUST';
  unitPrice: string;
  quantity: string;
  currency: string;
  occurredAt: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  quantity: string | null;
  disposed: boolean;
  assetTypeId: string;
  assetType: AssetType;
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
  currentValue: string | null;
}

export interface UpdateAssetRequest {
  name?: string;
  quantity?: string;
  assetTypeId?: string;
  categoryIds?: string[];
  tagIds?: string[];
  acquisitionDate?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/lib/types/index.ts
git commit -m "feat(F2): add Transaction type, extend Asset and UpdateAssetRequest"
```

---

### Task 6: Frontend — Full AssetEditDialog

**Files:**
- Modify: `front/src/components/assets/AssetEditDialog.tsx`

- [ ] **Step 1: Rewrite AssetEditDialog with all fields**

```typescript
import { useState, useEffect } from 'react';
import { Button, Dialog, DialogHeader, DialogTitle, DialogFooter, Input, Select } from '@/components/ui';
import type { Asset, AssetType, Category, Tag } from '@/lib/types';
import { getAssetTypeIcon } from '@/lib/format';

interface EditValues {
  name: string;
  assetTypeId: string;
  quantity?: string;
  categoryIds: string[];
  tagIds: string[];
  acquisitionDate: string;
}

interface Props {
  open: boolean;
  asset: Asset;
  assetTypes: AssetType[];
  allCategories: Category[];
  allTags: Tag[];
  onClose: () => void;
  onSave: (values: EditValues) => Promise<void> | void;
}

export function AssetEditDialog({ open, asset, assetTypes, allCategories, allTags, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [assetTypeId, setAssetTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [acquisitionDate, setAcquisitionDate] = useState('');

  useEffect(() => {
    if (open) {
      setName(asset.name);
      setAssetTypeId(asset.assetType?.id ?? '');
      setQuantity(asset.quantity ?? '');
      setCategoryIds(asset.categories?.map(c => c.id) ?? []);
      setTagIds(asset.tags?.map(t => t.id) ?? []);
      const acquireTx = asset.transactions?.find(t => t.type === 'ACQUIRE');
      setAcquisitionDate(
        acquireTx ? acquireTx.occurredAt.slice(0, 10) : ''
      );
    }
  }, [open, asset]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      assetTypeId,
      quantity: quantity || undefined,
      categoryIds,
      tagIds,
      acquisitionDate,
    });
    onClose();
  };

  const toggleCategory = (id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader><DialogTitle>Edit Asset</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div>
          <label htmlFor="asset-edit-name" className="text-sm font-medium">Name</label>
          <Input id="asset-edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label htmlFor="asset-edit-type" className="text-sm font-medium">Asset Type</label>
          <Select id="asset-edit-type" value={assetTypeId} onChange={(e) => setAssetTypeId(e.target.value)} className="mt-1">
            <option value="">Select type...</option>
            {assetTypes.map(t => (
              <option key={t.id} value={t.id}>{getAssetTypeIcon(t.code)} {t.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="asset-edit-qty" className="text-sm font-medium">Quantity</label>
          <Input id="asset-edit-qty" type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label htmlFor="asset-edit-acq-date" className="text-sm font-medium">Acquisition Date</label>
          <Input id="asset-edit-acq-date" type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} className="mt-1" />
        </div>
        {allCategories.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Categories</p>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => (
                <label key={c.id} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="rounded"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {allTags.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Tags</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(t => (
                <label key={t.id} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(t.id)}
                    onChange={() => toggleTag(t.id)}
                    className="rounded"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add front/src/components/assets/AssetEditDialog.tsx
git commit -m "feat(F2): expand AssetEditDialog to include all editable fields"
```

---

### Task 7: Frontend — Update AssetDetailPage

**Files:**
- Modify: `front/src/components/assets/AssetDetailPage.tsx`

- [ ] **Step 1: Add useAssetTypes hook and update handleSaveEdit and AssetEditDialog usage**

Add `useAssetTypes` import and hook, update `handleSaveEdit` to pass all fields, pass `assetTypes`, `allCategories`, `allTags` to `AssetEditDialog`.

- [ ] **Step 2: Commit**

```bash
git add front/src/components/assets/AssetDetailPage.tsx
git commit -m "feat(F2): update AssetDetailPage to use full edit form"
```

---

### Task 8: Run all tests and fix failures

- [ ] **Step 1: Run backend tests**

```bash
cd backend && npm test
```

- [ ] **Step 2: Run frontend tests**

```bash
cd front && npm test
```

- [ ] **Step 3: Fix any failures**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix(F2): fix test failures from F2 implementation"
```
