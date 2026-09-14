import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class DashboardController {
  summary = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await dashboardService.getSummary(user.id);
    sendSuccess(res, data);
  });
}

export const dashboardController = new DashboardController();
