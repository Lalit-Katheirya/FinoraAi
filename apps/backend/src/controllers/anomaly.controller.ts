import type { Request, Response } from 'express';
import { anomalyService } from '../services/anomaly.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class AnomalyController {
  detect = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await anomalyService.detect(user.id, req.query as never);
    sendSuccess(res, data);
  });
}

export const anomalyController = new AnomalyController();
