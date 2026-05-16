import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  title: string;
  memorySummary: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    title: { type: String, default: 'New Conversation' },
    memorySummary: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
