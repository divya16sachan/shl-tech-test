import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  activeConversationId: string | null;
  isStreaming: boolean;
  recommendations: any[];
  selectedModel: string;
  isRecommendationsOpen: boolean;
  setActiveConversationId: (id: string | null) => void;
  setStreaming: (status: boolean) => void;
  setRecommendations: (recs: any[]) => void;
  setSelectedModel: (model: string) => void;
  setRecommendationsOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  isStreaming: false,
  recommendations: [],
  selectedModel: 'llama-3.3-70b-versatile',
  isRecommendationsOpen: true, // Default to open on desktop
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setStreaming: (status) => set({ isStreaming: status }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setRecommendationsOpen: (open) => set({ isRecommendationsOpen: open }),
}));
