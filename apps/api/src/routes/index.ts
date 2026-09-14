import { Router } from 'express';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import categoryRoutes from './category.routes';
import budgetRoutes from './budget.routes';
import goalRoutes from './goal.routes';
import investmentRoutes from './investment.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import recurringRoutes from './recurring.routes';
import anomalyRoutes from './anomaly.routes';
import forecastRoutes from './forecast.routes';
import insightRoutes from './insight.routes';
import importRoutes from './import.routes';
import categorizationRoutes from './categorization.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/investments', investmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/recurring', recurringRoutes);
router.use('/anomalies', anomalyRoutes);
router.use('/forecast', forecastRoutes);
router.use('/insights', insightRoutes);
router.use('/import', importRoutes);
router.use('/categorization', categorizationRoutes);

export default router;
