import type { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { requireUser } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export class ReportController {
  summary = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = req.query as {
      period: 'monthly' | 'quarterly' | 'annual';
      year?: number;
      month?: number;
      quarter?: number;
      format?: 'json' | 'csv';
    };

    if (query.format === 'csv') {
      const csv = await reportService.exportCsv(user.id, query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="finora-report.csv"');
      res.status(200).send(csv);
      return;
    }

    const data = await reportService.summary(user.id, query);
    sendSuccess(res, data);
  });

  exportCsv = asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = req.query as {
      period: 'monthly' | 'quarterly' | 'annual';
      year?: number;
      month?: number;
      quarter?: number;
    };
    const csv = await reportService.exportCsv(user.id, query);
    sendSuccess(res, { csv });
  });
}

export const reportController = new ReportController();
