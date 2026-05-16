import mongoose, { Schema } from 'mongoose';
const MessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    embeddingId: { type: String },
    recommendations: { type: [Schema.Types.Mixed], default: [] },
    model: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });
export const Message = mongoose.model('Message', MessageSchema);
