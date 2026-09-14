import type { Request, Response } from 'express';
import { categorizationService } from '../services/categorization.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class CategorizationController {
  categorize = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categorizationService.categorize(user.id, req.body);
    sendSuccess(res, data);
  });

  correct = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categorizationService.applyCorrection(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  listCorrections = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await categorizationService.listCorrections(user.id);
    sendSuccess(res, data);
  });
}

export const categorizationController = new CategorizationController();
