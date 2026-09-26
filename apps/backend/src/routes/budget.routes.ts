import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  budgetIdParamSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../validators/budget.validators';

const router = Router();

router.use(authenticate);
router.get('/', budgetController.list);
router.get('/:id', validate(budgetIdParamSchema), budgetController.getById);
router.post('/', validate(createBudgetSchema), budgetController.create);
router.patch('/:id', validate(updateBudgetSchema), budgetController.update);
router.delete('/:id', validate(budgetIdParamSchema), budgetController.remove);

export default router;
