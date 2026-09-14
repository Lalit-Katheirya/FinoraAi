import type { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class CategoryController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categoryService.list(user.id);
    sendSuccess(res, data);
  });

  seed = asyncHandler(async (req: Request, res: Response) => {
    requireUser(req);
    await categoryService.ensureSystemSeeded();
    sendMessage(res, 'System categories seeded');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categoryService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categoryService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await categoryService.remove(user.id, req.params.id);
    sendMessage(res, 'Category deleted');
  });
}

export const categoryController = new CategoryController();
