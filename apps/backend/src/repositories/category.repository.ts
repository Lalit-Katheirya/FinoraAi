import { Category } from '../models';

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  isSystem?: boolean;
  userId?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}

export class CategoryRepository {
  async listForUser(userId: string) {
    return Category.find({
      $or: [{ isSystem: true }, { userId }],
    })
      .sort({ isSystem: -1, name: 1 })
      .exec();
  }

  async findById(id: string) {
    return Category.findById(id).exec();
  }

  async findByName(name: string, userId?: string) {
    return Category.findOne({
      name,
      $or: [{ isSystem: true }, ...(userId ? [{ userId }] : [])],
    }).exec();
  }

  async create(data: CreateCategoryInput) {
    return Category.create(data);
  }

  async update(id: string, data: UpdateCategoryInput) {
    return Category.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Category.findByIdAndDelete(id).exec();
  }

  async countSystem(): Promise<number> {
    return Category.countDocuments({ isSystem: true }).exec();
  }

  async insertMany(data: CreateCategoryInput[]) {
    return Category.insertMany(data);
  }
}

export const categoryRepository = new CategoryRepository();
