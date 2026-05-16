import { Router } from 'express';
import { 
    getConversations,
    getConversation,
    getConversationMessages, 
    renameConversation, 
    deleteConversation 
} from '../controllers/conversation.controller.js';

const router = Router();

router.get('/', getConversations);
router.get('/:id', getConversation);
router.get('/:id/messages', getConversationMessages);
router.patch('/:id', renameConversation);
router.delete('/:id', deleteConversation);

export default router;
