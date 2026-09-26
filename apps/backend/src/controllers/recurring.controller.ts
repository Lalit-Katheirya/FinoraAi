import type { Request, Response } from 'express';
import { recurringService } from '../services/recurring.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class RecurringController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await recurringService.list(user.id);
    sendSuccess(res, data);
  });

  detect = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await recurringService.detect(user.id, req.query as never);
    sendSuccess(res, data);
  });
}

export const recurringController = new RecurringController();
