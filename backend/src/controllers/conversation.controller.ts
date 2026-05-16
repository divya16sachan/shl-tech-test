import { Request, Response } from 'express';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

export async function getConversations(req: Request, res: Response) {
    try {
        const conversations = await Conversation.find().sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}

export async function getConversation(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ error: 'Not found' });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
}

export async function getConversationMessages(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

export async function renameConversation(req: Request, res: Response) {
    const { id } = req.params;
    const { title } = req.body;
    try {
        const conversation = await Conversation.findByIdAndUpdate(id, { title }, { new: true });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to rename conversation' });
    }
}

export async function deleteConversation(req: Request, res: Response) {
    const { id } = req.params;
    try {
        await Conversation.findByIdAndDelete(id);
        await Message.deleteMany({ conversationId: id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
}
