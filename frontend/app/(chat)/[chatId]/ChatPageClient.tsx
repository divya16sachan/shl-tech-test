"use client"

import { useEffect } from "react"
import { ChatWorkspace } from "@/components/chat-workspace"
import { useChatStore } from "@/store/useChatStore"
import { useConversations } from "@/hooks/useChat"

export default function ChatPageClient({ chatId }: { chatId: string }) {
  const { setActiveConversationId } = useChatStore()
  const { data: conversations } = useConversations()

  useEffect(() => {
    setActiveConversationId(chatId)
  }, [chatId, setActiveConversationId])

  // Real-time title sync for client-side navigation/renames
  useEffect(() => {
    const activeConv = conversations?.find((c: any) => c._id === chatId)
    if (activeConv && activeConv.title) {
      document.title = `${activeConv.title} | AI Recruiter`
    }
  }, [chatId, conversations])

  return <ChatWorkspace chatId={chatId} />
}
