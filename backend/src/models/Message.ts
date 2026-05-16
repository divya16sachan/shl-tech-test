import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Omit<Document, 'model'> {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  embeddingId?: string;
  recommendations?: any[];
  model?: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    embeddingId: { type: String },
    recommendations: { type: [Schema.Types.Mixed], default: [] },
    model: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
