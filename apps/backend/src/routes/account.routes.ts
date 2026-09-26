import { Router } from 'express';
import { accountController } from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  accountIdParamSchema,
  createAccountSchema,
  updateAccountSchema,
} from '../validators/account.validators';

const router = Router();

router.use(authenticate);
router.get('/', accountController.list);
router.get('/:id', validate(accountIdParamSchema), accountController.getById);
router.post('/', validate(createAccountSchema), accountController.create);
router.patch('/:id', validate(updateAccountSchema), accountController.update);
router.delete('/:id', validate(accountIdParamSchema), accountController.remove);

export default router;
