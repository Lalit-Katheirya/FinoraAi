import type { Request, Response } from 'express';
import { budgetService } from '../services/budget.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class BudgetController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await budgetService.list(user.id);
    sendSuccess(res, data);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await budgetService.getById(user.id, req.params.id);
    sendSuccess(res, data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await budgetService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await budgetService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await budgetService.remove(user.id, req.params.id);
    sendMessage(res, 'Budget deleted');
  });
}

export const budgetController = new BudgetController();
