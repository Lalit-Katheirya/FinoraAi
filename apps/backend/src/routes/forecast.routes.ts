import { Router } from 'express';
import { forecastController } from '../controllers/forecast.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { forecastQuerySchema } from '../validators/forecast.validators';

const router = Router();

router.use(authenticate);
router.get('/', validate(forecastQuerySchema), forecastController.cashFlow);

export default router;
