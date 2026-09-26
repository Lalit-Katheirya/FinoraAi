import type { Request, Response } from 'express';
import { goalService } from '../services/goal.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class GoalController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await goalService.list(user.id);
    sendSuccess(res, data);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await goalService.getById(user.id, req.params.id);
    sendSuccess(res, data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await goalService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await goalService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await goalService.remove(user.id, req.params.id);
    sendMessage(res, 'Goal deleted');
  });
}

export const goalController = new GoalController();
