import type { Request, Response } from 'express';
import { accountService } from '../services/account.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendMessage, sendSuccess } from '../utils/apiResponse';

export class AccountController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await accountService.list(user.id);
    sendSuccess(res, data);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await accountService.getById(user.id, req.params.id);
    sendSuccess(res, data);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await accountService.create(user.id, req.body);
    sendSuccess(res, data, 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await accountService.update(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await accountService.remove(user.id, req.params.id);
    sendMessage(res, 'Account deleted');
  });
}

export const accountController = new AccountController();
