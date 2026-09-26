import type { InvestmentDto } from '@finora/shared';
import {
  investmentRepository,
  type CreateInvestmentInput,
  type UpdateInvestmentInput,
} from '../repositories/investment.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { computeInvestmentMetrics } from '../utils/financeMetrics';

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export class InvestmentService {
  private toDto(inv: {
    _id: unknown;
    userId: unknown;
    name: unknown;
    type: unknown;
    investedAmount: unknown;
    currentValue: unknown;
    units?: unknown;
    purchaseDate: unknown;
    notes?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  }): InvestmentDto {
    const investedAmount = Number(inv.investedAmount);
    const currentValue = Number(inv.currentValue);
    const metrics = computeInvestmentMetrics(investedAmount, currentValue);

    return {
      id: String(inv._id),
      userId: String(inv.userId),
      name: String(inv.name),
      type: inv.type as InvestmentDto['type'],
      investedAmount,
      currentValue,
      units: inv.units !== undefined && inv.units !== null ? Number(inv.units) : undefined,
      purchaseDate: dateIso(inv.purchaseDate),
      notes: inv.notes as string | undefined,
      profitLoss: metrics.profitLoss,
      returnPercent: metrics.returnPercent,
      createdAt: dateIso(inv.createdAt),
      updatedAt: dateIso(inv.updatedAt),
    };
  }

  async list(userId: string): Promise<InvestmentDto[]> {
    const items = await investmentRepository.findByUser(userId);
    return items.map((i) => this.toDto(i as never));
  }

  async getById(userId: string, id: string): Promise<InvestmentDto> {
    const inv = await investmentRepository.findById(id);
    if (!inv) throw AppError.notFound('Investment not found');
    assertOwned(String(inv.userId), userId);
    return this.toDto(inv as never);
  }

  async create(
    userId: string,
    input: Omit<CreateInvestmentInput, 'userId'>
  ): Promise<InvestmentDto> {
    const created = await investmentRepository.create({ ...input, userId });
    return this.toDto(created as never);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateInvestmentInput
  ): Promise<InvestmentDto> {
    const inv = await investmentRepository.findById(id);
    if (!inv) throw AppError.notFound('Investment not found');
    assertOwned(String(inv.userId), userId);
    const updated = await investmentRepository.update(id, input);
    if (!updated) throw AppError.notFound('Investment not found');
    return this.toDto(updated as never);
  }

  async remove(userId: string, id: string): Promise<void> {
    const inv = await investmentRepository.findById(id);
    if (!inv) throw AppError.notFound('Investment not found');
    assertOwned(String(inv.userId), userId);
    await investmentRepository.delete(id);
  }
}

export const investmentService = new InvestmentService();
