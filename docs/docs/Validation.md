# Validation

Strata uses **layered validation** — each layer validates what it owns.

## Layer 1: Presentation (DTO)

Request DTOs use `class-validator` decorators for shape and type validation.

```typescript
// presentation/dto/create-asset.request.dto.ts
export class CreateAssetRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  portfolioId: string;

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
const portfolio = await this.portfolioRepo.findById(command.portfolioId);
if (!portfolio) throw new PortfolioNotFound(command.portfolioId);

const assetType = await this.assetTypeRepo.findById(command.assetTypeId);
if (!assetType) throw new AssetTypeNotFound(command.assetTypeId);
```

## Layer 3: Domain (Entity)

Domain entities enforce business invariants in their constructors or methods.

## Layer 4: Infrastructure (Database)

Prisma enforces `@unique` constraints, foreign keys, and data types. The repository layer catches Prisma errors and translates them to domain exceptions.

## Exception Mapping

Domain exceptions are mapped to HTTP status codes by the `DomainExceptionFilter`:

| Exception | HTTP Status |
|-----------|------------|
| AssetNotFound | 404 |
| PortfolioNotFound | 404 |
| CategoryNotFound | 404 |
| TagNotFound | 404 |
| AssetTypeNotFound | 404 |
| DuplicateName | 409 |
| CategoryHasChildren | 409 |