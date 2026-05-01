---
title: "Validation"
---


Strata uses **layered validation** — each layer validates what it owns.

## Layer 1: Presentation (DTO)

Request DTOs use `class-validator` decorators for shape and type validation.

```typescript
// presentation/dto/asset/create-asset.dto.ts
export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  assetTypeId: string;

  @IsOptional()
  @IsString()
  quantity?: string;
}
```

Invalid requests receive a **400 Bad Request** with validation error details.

## Layer 2: Application (Use Case)

Services check business preconditions — entity existence, authorization, etc.

```typescript
// application/services/asset.service.ts
const assetType = await this.assetTypeRepo.findById(command.assetTypeId);
if (!assetType) throw new AssetTypeNotFoundException(command.assetTypeId);
```

## Layer 3: Domain (Entity)

Domain entities enforce business invariants in their constructors or methods.

## Layer 4: Infrastructure (Database)

Prisma enforces `@unique` constraints, foreign keys, and data types. The repository layer catches Prisma errors and translates them to domain exceptions.

## Exception Mapping

Domain exceptions are mapped to HTTP status codes by the `DomainExceptionFilter`:

| Exception | HTTP Status |
|-----------|------------|
| AssetNotFoundException | 404 |
| CategoryNotFoundException | 404 |
| TagNotFoundException | 404 |
| AssetTypeNotFoundException | 404 |
| DuplicateNameException | 409 |
| CategoryHasChildrenException | 409 |
