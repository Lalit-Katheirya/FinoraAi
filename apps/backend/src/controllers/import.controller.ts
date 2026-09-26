import type { Request, Response } from 'express';
import { importService } from '../services/import.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export class ImportController {
  uploadCsv = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    if (!req.file) throw AppError.badRequest('CSV file is required');
    const data = await importService.uploadCsv(user.id, req.file);
    sendSuccess(res, data, 201);
  });

  uploadPdf = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    if (!req.file) throw AppError.badRequest('PDF file is required');
    const data = await importService.uploadPdf(user.id, req.file);
    sendSuccess(res, data, 201);
  });

  mapColumns = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.mapColumns(user.id, req.params.id, req.body);
    sendSuccess(res, data);
  });

  preview = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.preview(user.id, req.params.id);
    sendSuccess(res, data);
  });

  validate = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.validate(user.id, req.params.id);
    sendSuccess(res, data);
  });

  editRow = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.editRow(
      user.id,
      req.params.id,
      req.params.rowId,
      req.body
    );
    sendSuccess(res, data);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.approve(user.id, req.params.id);
    sendSuccess(res, data);
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const data = await importService.reject(user.id, req.params.id);
    sendSuccess(res, data);
  });
}

export const importController = new ImportController();
