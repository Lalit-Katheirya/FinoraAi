import type { Request, Response } from 'express';
import { forecastService } from '../services/forecast.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class ForecastController {
  cashFlow = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const months = Number((req.query as { months?: number }).months ?? 6);
    const data = await forecastService.cashFlow(user.id, months);
    sendSuccess(res, data);
  });
}

export const forecastController = new ForecastController();
