import { Metadata } from "next"
import { fetchConversation } from "@/lib/api"
import ChatPageClient from "./ChatPageClient"

interface Props {
  params: Promise<{ chatId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chatId } = await params
  try {
    const conversation = await fetchConversation(chatId)
    return {
      title: `${conversation.title} | AI Recruiter`,
      description: `Viewing conversation: ${conversation.title}. Explore AI-driven SHL assessment recommendations.`,
    }
  } catch (error) {
    return {
      title: "Chat | AI Recruiter",
      description: "AI-driven SHL assessment recommendations.",
    }
  }
}

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params

  return <ChatPageClient chatId={chatId} />
}
