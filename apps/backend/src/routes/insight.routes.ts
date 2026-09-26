import { Router } from 'express';
import { insightController } from '../controllers/insight.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  insightIdParamSchema,
  listInsightsSchema,
} from '../validators/insight.validators';

const router = Router();

router.use(authenticate);
router.get('/', validate(listInsightsSchema), insightController.list);
router.post('/daily-summary', insightController.generateDaily);
router.patch('/:id/read', validate(insightIdParamSchema), insightController.markRead);

export default router;
