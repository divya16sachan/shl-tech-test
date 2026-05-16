import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessages, api } from '@/lib/api';
import { useChatStore } from '@/store/useChatStore';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
};

export const useConversationMessages = (id: string | null) => {
  return useQuery({
    queryKey: ['messages', id],
    queryFn: () => (id ? fetchMessages(id) : []),
    enabled: !!id,
    staleTime: 0, // Ensure we get fresh messages when switching
  });
};

export const useChatActions = () => {
  const queryClient = useQueryClient();
  const { setActiveConversationId } = useChatStore();

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string, title: string }) => api.patch(`/conversations/${id}`, { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(null);
    },
  });

  return {
    renameConversation: renameMutation.mutate,
    deleteConversation: deleteMutation.mutate,
  };
};
