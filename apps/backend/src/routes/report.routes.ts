import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { reportPeriodSchema } from '../validators/report.validators';

const router = Router();

router.use(authenticate);
router.get('/summary', validate(reportPeriodSchema), reportController.summary);
router.get('/export.csv', validate(reportPeriodSchema), reportController.exportCsv);

export default router;
