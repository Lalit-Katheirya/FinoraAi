import { insightService } from '../services/insight.service';
import { logger } from '../config/logger';

/**
 * Callable job entrypoint to generate a daily financial summary for a user.
 * Can be invoked by a cron scheduler or admin script.
 */
export async function runDailySummaryJob(userId: string): Promise<void> {
  logger.info({ userId }, 'Running daily summary job');
  const insights = await insightService.generateDailySummary(userId);
  logger.info(
    { userId, insightCount: insights.length },
    'Daily summary job completed'
  );
}
