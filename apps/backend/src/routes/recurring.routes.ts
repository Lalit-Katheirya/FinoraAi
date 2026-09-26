import { Router } from 'express';
import { recurringController } from '../controllers/recurring.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { detectRecurringSchema } from '../validators/recurring.validators';

const router = Router();

router.use(authenticate);
router.get('/', recurringController.list);
router.post('/detect', validate(detectRecurringSchema), recurringController.detect);

export default router;
