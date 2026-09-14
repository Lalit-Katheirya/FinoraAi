import type { Request, Response } from 'express';
import { investmentService } from '../services/investment.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class InvestmentController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await investmentService.list(user.id);
    sendSuccess(res, data);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await investmentService.getById(user.id, req.params.id);
    sendSuccess(res, data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await investmentService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await investmentService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await investmentService.remove(user.id, req.params.id);
    sendMessage(res, 'Investment deleted');
  });
}

export const investmentController = new InvestmentController();
