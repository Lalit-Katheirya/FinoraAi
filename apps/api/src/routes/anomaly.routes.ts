import { Router } from 'express';
import { anomalyController } from '../controllers/anomaly.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { anomalyQuerySchema } from '../validators/anomaly.validators';

const router = Router();

router.use(authenticate);
router.get('/', validate(anomalyQuerySchema), anomalyController.detect);

export default router;
