import { PortfolioSnapshotResponseDto } from '../../dto/responses/index.js';
import type { PortfolioSnapshot } from '../../../domain/entities/index.js';

export function mapPortfolioSnapshotToResponse(
  snapshot: PortfolioSnapshot,
): PortfolioSnapshotResponseDto {
  const dto = new PortfolioSnapshotResponseDto();
  dto.id = snapshot.id;
  dto.value = snapshot.value.toString();
  dto.currency = snapshot.currency;
  dto.notes = snapshot.notes;
  dto.observedAt = snapshot.observedAt.toISOString();
  dto.createdAt = snapshot.createdAt.toISOString();
  return dto;
}
