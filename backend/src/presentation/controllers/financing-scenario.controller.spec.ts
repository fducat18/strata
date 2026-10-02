import { FinancingScenario } from '../../domain/entities/financing-scenario.entity.js';
import { calculateFinancingScenario } from '../../application/services/financing-scenario-calculator.js';
import { FinancingScenarioController } from './financing-scenario.controller.js';

const timestamp = new Date('2026-09-28T00:00:00.000Z');
const inputs = {
  purchasePrice: '10000.00',
  customDownPayment: '5000.00',
  emergencyReserve: '0.00',
  monthlyAvailableAmount: '1000.00',
  loanRatePercent: '8',
  insuranceFeePercent: '0.5',
  loanDurationMonths: 12,
  loanSetupFee: '0.00',
  assets: [],
};
const scenario = Object.assign(
  new FinancingScenario('s1', 'Car', 'EUR', inputs, timestamp, timestamp),
  { calculation: calculateFinancingScenario(inputs) },
);

describe('FinancingScenarioController', () => {
  let controller: FinancingScenarioController;
  let service: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    recalculate: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    service = {
      findAll: jest.fn().mockResolvedValue([scenario]),
      findById: jest.fn().mockResolvedValue(scenario),
      create: jest.fn().mockResolvedValue(scenario),
      update: jest.fn().mockResolvedValue(scenario),
      recalculate: jest.fn().mockResolvedValue(scenario),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    controller = new FinancingScenarioController(service as never);
  });

  it('maps saved scenarios for list and get responses', async () => {
    const list = await controller.findAll();
    const one = await controller.findById('s1');
    expect(list[0]).toMatchObject({ id: 's1', name: 'Car', currency: 'EUR' });
    expect(one.inputs.purchasePrice).toBe('10000.00');
    expect(one.calculation.status).toBe('NO_ELIGIBLE_ASSETS');
    expect(one.createdAt).toBe(timestamp.toISOString());
  });

  it('passes create and update request DTOs to the application service', async () => {
    const dto = { ...inputs, name: 'Car' } as any;
    await controller.create(dto);
    await controller.update('s1', dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.update).toHaveBeenCalledWith('s1', dto);
  });

  it('recalculates and deletes the requested scenario', async () => {
    await controller.recalculate('s1');
    await controller.delete('s1');
    expect(service.recalculate).toHaveBeenCalledWith('s1');
    expect(service.delete).toHaveBeenCalledWith('s1');
  });
});
