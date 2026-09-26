import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { aiChatService } from '../services/ai-chat.service';

const chatBody = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

const router = Router();

router.use(authenticate);

router.post(
  '/chat',
  validate({ body: chatBody }),
  asyncHandler(async (req, res) => {
    const result = await aiChatService.chat(
      req.user!.id,
      req.body.message,
      req.body.conversationId
    );
    sendSuccess(res, result);
  })
);

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const conversations = await aiChatService.listConversations(req.user!.id);
    sendSuccess(res, conversations);
  })
);

router.get(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conversation = await aiChatService.getConversation(req.user!.id, req.params.id);
    sendSuccess(res, conversation);
  })
);

export default router;
