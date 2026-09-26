import type { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class TransactionController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await transactionService.list(user.id, req.query as never);
    sendSuccess(res, result.data, 200, result.meta);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await transactionService.getById(user.id, req.params.id);
    sendSuccess(res, data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await transactionService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await transactionService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await transactionService.remove(user.id, req.params.id);
    sendMessage(res, 'Transaction deleted');
  });
}

export const transactionController = new TransactionController();
