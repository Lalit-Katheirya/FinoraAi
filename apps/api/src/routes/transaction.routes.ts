import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTransactionSchema,
  listTransactionsSchema,
  transactionIdParamSchema,
  updateTransactionSchema,
} from '../validators/transaction.validators';

const router = Router();

router.use(authenticate);
router.get('/', validate(listTransactionsSchema), transactionController.list);
router.get('/:id', validate(transactionIdParamSchema), transactionController.getById);
router.post('/', validate(createTransactionSchema), transactionController.create);
router.patch('/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/:id', validate(transactionIdParamSchema), transactionController.remove);

export default router;
