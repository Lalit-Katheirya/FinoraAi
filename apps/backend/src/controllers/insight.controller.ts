import type { Request, Response } from 'express';
import { insightService } from '../services/insight.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class InsightController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const unreadOnly = Boolean((req.query as { unreadOnly?: boolean }).unreadOnly);
    const data = await insightService.list(user.id, unreadOnly);
    sendSuccess(res, data);
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await insightService.markRead(user.id, req.params.id);
    sendSuccess(res, data);
  });

  generateDaily = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await insightService.generateDailySummary(user.id);
    sendSuccess(res, data, 201);
  });
}

export const insightController = new InsightController();
