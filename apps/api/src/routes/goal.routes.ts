import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createGoalSchema,
  goalIdParamSchema,
  updateGoalSchema,
} from '../validators/goal.validators';

const router = Router();

router.use(authenticate);
router.get('/', goalController.list);
router.get('/:id', validate(goalIdParamSchema), goalController.getById);
router.post('/', validate(createGoalSchema), goalController.create);
router.patch('/:id', validate(updateGoalSchema), goalController.update);
router.delete('/:id', validate(goalIdParamSchema), goalController.remove);

export default router;
