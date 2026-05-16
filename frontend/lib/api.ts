import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchConversations = async () => {
  const { data } = await api.get('/conversations');
  return data;
};

export const fetchConversation = async (id: string) => {
  const { data } = await api.get(`/conversations/${id}`);
  return data;
};

export const fetchMessages = async (conversationId: string) => {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
};

export const streamChat = async (
  conversationId: string | null,
  content: string,
  model: string,
  onToken: (token: string) => void,
  onRecommendations: (recs: any[]) => void,
  onComplete: (id: string) => void,
  onStatus?: (status: string, detail?: string) => void,
  onIntent?: (intent: string) => void,
  onRetrievedCount?: (count: number, detail?: string) => void
) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, messages: [{ role: 'user', content }], model }),
  });

  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finished = false;

  while (!finished) {
    const { value, done } = await reader.read();
    finished = done;
    if (value) {
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            finished = true;
            break;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'text') onToken(data.content);
            if (data.type === 'recommendations') onRecommendations(data.content);
            if (data.type === 'conversationId') onComplete(data.content);
            if (data.type === 'status' && onStatus) onStatus(data.status, data.detail);
            if (data.type === 'intent' && onIntent) onIntent(data.intent);
            if (data.type === 'retrieved_count' && onRetrievedCount) onRetrievedCount(data.count, data.detail);
          } catch (e) {
            // console.error('Error parsing chunk', e);
          }
        }
      }
    }
  }
};

export const sendMessage = async (conversationId: string | null, content: string) => {
  const { data } = await api.post('/chat', { conversationId, messages: [{ role: 'user', content }] });
  return data;
};
