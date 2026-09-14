import { Router } from 'express';
import { investmentController } from '../controllers/investment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createInvestmentSchema,
  investmentIdParamSchema,
  updateInvestmentSchema,
} from '../validators/investment.validators';

const router = Router();

router.use(authenticate);
router.get('/', investmentController.list);
router.get('/:id', validate(investmentIdParamSchema), investmentController.getById);
router.post('/', validate(createInvestmentSchema), investmentController.create);
router.patch('/:id', validate(updateInvestmentSchema), investmentController.update);
router.delete('/:id', validate(investmentIdParamSchema), investmentController.remove);

export default router;
