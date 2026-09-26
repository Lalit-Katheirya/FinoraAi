import { Router } from 'express';
import { importController } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  importIdParamSchema,
  importMapSchema,
  importRowEditSchema,
} from '../validators/import.validators';

const router = Router();

router.use(authenticate);
router.post('/csv', upload.single('file'), importController.uploadCsv);
router.post('/pdf', upload.single('file'), importController.uploadPdf);
router.post('/:id/map', validate(importMapSchema), importController.mapColumns);
router.get('/:id/preview', validate(importIdParamSchema), importController.preview);
router.post('/:id/validate', validate(importIdParamSchema), importController.validate);
router.patch(
  '/:id/rows/:rowId',
  validate(importRowEditSchema),
  importController.editRow
);
router.post('/:id/approve', validate(importIdParamSchema), importController.approve);
router.post('/:id/reject', validate(importIdParamSchema), importController.reject);

export default router;
