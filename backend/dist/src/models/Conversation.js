import mongoose, { Schema } from 'mongoose';
const ConversationSchema = new Schema({
    title: { type: String, default: 'New Conversation' },
    memorySummary: { type: String, default: '' },
}, { timestamps: true });
export const Conversation = mongoose.model('Conversation', ConversationSchema);
