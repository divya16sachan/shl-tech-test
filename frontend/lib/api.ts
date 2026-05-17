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

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = "Failed to connect to the server.";
    try {
      const errorJson = JSON.parse(errorText);
      parsedError = errorJson.error || errorJson.message || parsedError;
    } catch {
      parsedError = errorText || parsedError;
    }
    throw new Error(parsedError);
  }

  if (!response.body) {
    throw new Error("No response body received from the server.");
  }

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
          
          let parsedData: any = null;
          try {
            parsedData = JSON.parse(dataStr);
          } catch {
            continue;
          }

          if (parsedData) {
            if (parsedData.type === 'error') {
              throw new Error(parsedData.content || "An error occurred on the backend.");
            }
            if (parsedData.type === 'text') onToken(parsedData.content);
            if (parsedData.type === 'recommendations') onRecommendations(parsedData.content);
            if (parsedData.type === 'conversationId') onComplete(parsedData.content);
            if (parsedData.type === 'status' && onStatus) onStatus(parsedData.status, parsedData.detail);
            if (parsedData.type === 'intent' && onIntent) onIntent(parsedData.intent);
            if (parsedData.type === 'retrieved_count' && onRetrievedCount) onRetrievedCount(parsedData.count, parsedData.detail);
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
