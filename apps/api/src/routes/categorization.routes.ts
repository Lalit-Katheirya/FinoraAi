import { Router } from 'express';
import { categorizationController } from '../controllers/categorization.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  categorizeSchema,
  correctionSchema,
} from '../validators/categorization.validators';

const router = Router();

router.use(authenticate);
router.post('/', validate(categorizeSchema), categorizationController.categorize);
router.get('/corrections', categorizationController.listCorrections);
router.post('/corrections', validate(correctionSchema), categorizationController.correct);

export default router;
