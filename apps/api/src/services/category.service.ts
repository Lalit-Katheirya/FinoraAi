import { CATEGORY_NAMES, type CategoryDto } from '@finora/shared';
import {
  categoryRepository,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../repositories/category.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { toCategoryDto } from '../utils/mappers';

const SYSTEM_COLORS = [
  '#0F766E',
  '#0369A1',
  '#B45309',
  '#BE123C',
  '#7C3AED',
  '#15803D',
  '#C2410C',
  '#1D4ED8',
];

export class CategoryService {
  async list(userId: string): Promise<CategoryDto[]> {
    await this.ensureSystemSeeded();
    const categories = await categoryRepository.listForUser(userId);
    return categories.map((c) => toCategoryDto(c as never) as CategoryDto);
  }

  async ensureSystemSeeded(): Promise<void> {
    const count = await categoryRepository.countSystem();
    if (count > 0) return;

    const payload: CreateCategoryInput[] = CATEGORY_NAMES.map((name, index) => ({
      name,
      isSystem: true,
      icon: name.toLowerCase(),
      color: SYSTEM_COLORS[index % SYSTEM_COLORS.length],
    }));
    await categoryRepository.insertMany(payload);
  }

  async create(
    userId: string,
    input: Omit<CreateCategoryInput, 'userId' | 'isSystem'>
  ): Promise<CategoryDto> {
    const created = await categoryRepository.create({
      ...input,
      userId,
      isSystem: false,
    });
    return toCategoryDto(created as never) as CategoryDto;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateCategoryInput
  ): Promise<CategoryDto> {
    const category = await categoryRepository.findById(id);
    if (!category) throw AppError.notFound('Category not found');
    if (category.isSystem) {
      throw AppError.forbidden('System categories cannot be modified');
    }
    assertOwned(String(category.userId), userId);

    const updated = await categoryRepository.update(id, input);
    if (!updated) throw AppError.notFound('Category not found');
    return toCategoryDto(updated as never) as CategoryDto;
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await categoryRepository.findById(id);
    if (!category) throw AppError.notFound('Category not found');
    if (category.isSystem) {
      throw AppError.forbidden('System categories cannot be deleted');
    }
    assertOwned(String(category.userId), userId);
    await categoryRepository.delete(id);
  }
}

export const categoryService = new CategoryService();
