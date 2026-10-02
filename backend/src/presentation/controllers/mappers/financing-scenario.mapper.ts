import type { FinancingScenarioView } from '../../../application/services/financing-scenario.service.js';
import { FinancingScenarioResponseDto } from '../../dto/responses/financing-scenario.response.js';

export function mapFinancingScenarioToResponse(
  scenario: FinancingScenarioView,
): FinancingScenarioResponseDto {
  const dto = new FinancingScenarioResponseDto();
  dto.id = scenario.id;
  dto.name = scenario.name;
  dto.currency = scenario.currency;
  dto.inputs = scenario.inputs;
  dto.calculation = scenario.calculation;
  dto.createdAt = scenario.createdAt.toISOString();
  dto.updatedAt = scenario.updatedAt.toISOString();
  return dto;
}
