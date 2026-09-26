import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.validators';

const router = Router();

router.use(authenticate);
router.get('/', categoryController.list);
router.post('/seed', categoryController.seed);
router.post('/', validate(createCategorySchema), categoryController.create);
router.patch('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', validate(categoryIdParamSchema), categoryController.remove);

export default router;
