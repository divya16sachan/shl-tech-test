"use client"

import { useState, useEffect, useRef } from "react"
import { IconSend2, IconSparkles, IconLoader2, IconSearch, IconBook } from "@tabler/icons-react"
import { ChatMessage } from "./chat-message"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/store/useChatStore"
import { streamChat } from "@/lib/api"
import { useConversationMessages } from "@/hooks/useChat"
import { useRouter } from "next/navigation"
import { ChatInputBox } from "./ChatInputBox"
import { TextShimmer } from "./motion-primitives/text-shimmer"
import LogoIcon from "./icons/logo"
import { ChatSkeleton } from "./skeletons/chat-skeleton"

const suggestedPrompts = [
  "Hiring a Java backend developer",
  "Recommend leadership assessments",
  "Cognitive tests for graduates",
  "Compare OPQ and GSA",
]

export function ChatWorkspace({ chatId }: { chatId?: string }) {
  const router = useRouter()
  const { setActiveConversationId, setRecommendations, selectedModel } = useChatStore()
  const activeId = chatId || null
  const { data: history, isLoading } = useConversationMessages(activeId)

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Only show status AFTER the first token has NOT arrived yet
  // i.e. hide indicator once streaming text begins
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [statusDetail, setStatusDetail] = useState<string | null>(null)
  const [currentIntent, setCurrentIntent] = useState<string | null>(null)
  const [streamingStarted, setStreamingStarted] = useState(false)

  // ── Scroll: use a dedicated ref on the scrollable div, NOT window ──
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Track whether user has scrolled up manually during generation
  const userScrolledUp = useRef(false)
  const prevScrollTop = useRef(0)
  const initialLoadDone = useRef(false)

  // ── Load history ──
  useEffect(() => {
    if (history) {
      initialLoadDone.current = false
      setMessages(history)
      const lastAssistantMsg = [...history]
        .reverse()
        .find(m => m.role === "assistant" && m.recommendations?.length > 0)
      if (lastAssistantMsg) setRecommendations(lastAssistantMsg.recommendations)
    }
  }, [history])

  // ── Detect manual scroll-up during generation ──
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80

      if (scrollTop < prevScrollTop.current && !isAtBottom) {
        // User scrolled up
        userScrolledUp.current = true
      }
      if (isAtBottom) {
        // User scrolled back down — re-enable auto-scroll
        userScrolledUp.current = false
      }
      prevScrollTop.current = scrollTop
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // ── Auto-scroll only when user hasn't scrolled up ──
  const scrollToBottom = (force = false, smooth = true) => {
    if (!force && userScrolledUp.current) return
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }

  // Scroll on new messages / status — but not during streaming unless at bottom
  useEffect(() => {
    if (messages.length === 0) return

    if (!initialLoadDone.current) {
      // Instant scroll on initial history load
      scrollToBottom(true, false)
      initialLoadDone.current = true
    } else {
      if (!isGenerating) {
        // After generation completes always scroll to bottom
        scrollToBottom(true, true)
      } else {
        scrollToBottom(false, true)
      }
    }
  }, [messages, isGenerating])

  // Scroll when status indicator appears (before streaming starts)
  useEffect(() => {
    if (currentStatus && !streamingStarted) {
      scrollToBottom(false)
    }
  }, [currentStatus, streamingStarted])

  const handleSend = async (text: string) => {
    if (!text.trim() || isGenerating) return

    const userMsg = { id: Date.now().toString(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsGenerating(true)
    setStreamingStarted(false)
    userScrolledUp.current = false

    setCurrentStatus("thinking")
    setStatusDetail("Understanding your request…")

    const aiMsgId = (Date.now() + 1).toString()
    setMessages(prev => [
      ...prev,
      { id: aiMsgId, role: "assistant", content: "", isStreaming: true },
    ])

    let fullContent = ""

    try {
      await streamChat(
        activeId,
        text,
        selectedModel,
        (token) => {
          // First token arrived — hide the status indicator
          if (!streamingStarted) {
            setStreamingStarted(true)
            setCurrentStatus(null)
            setStatusDetail(null)
          }
          fullContent += token
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMsgId ? { ...msg, content: fullContent } : msg
            )
          )
        },
        (recs) => setRecommendations(recs),
        (newId) => {
          setActiveConversationId(newId)
          if (!activeId) router.push(`/${newId}`)
        },
        (status, detail) => {
          // Don't update status once streaming has started
          if (streamingStarted) return
          setCurrentStatus(status === "done" ? null : status)
          setStatusDetail(status === "done" ? null : (detail ?? null))
        },
        (intent) => setCurrentIntent(intent),
        (count, detail) => {
          if (!streamingStarted && detail) setStatusDetail(detail)
        }
      )
    } catch (err) {
      console.error("Stream error", err)
    } finally {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      )
      setIsGenerating(false)
      setCurrentStatus(null)
      setStatusDetail(null)
      setCurrentIntent(null)
      setStreamingStarted(false)
      userScrolledUp.current = false
      scrollToBottom(true)
    }
  }

  const showStatusIndicator =
    isGenerating && !streamingStarted && currentStatus

  return (
    <div className="flex flex-col h-full bg-background text-foreground">

      {/* ── Message area — grows with the page ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1"
      >
        {isLoading ? <ChatSkeleton /> :
          messages.length === 0 ? (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative flex aspect-square size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                  <LogoIcon className="size-20" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-light mb-3 text-center">
                How can I help you hire today?
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-all text-left text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto px-5 pt-5 pb-40">
              {messages.map(msg => (
                <ChatMessage key={msg.id || msg._id} message={msg} />
              ))}

              {/* Status indicator — hidden once first token arrives */}
              {showStatusIndicator && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {currentStatus === "thinking" && <IconLoader2 size={18} className="animate-spin" />}
                      {currentStatus === "retrieving" && <IconSearch size={18} className="animate-pulse" />}
                      {currentStatus === "reading" && <IconBook size={18} className="animate-pulse" />}
                      {currentStatus === "generating" && <IconSparkles size={18} className="animate-pulse" />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <TextShimmer className="font-mono text-sm" duration={1}>
                          {currentStatus + "…"}
                        </TextShimmer>
                        {currentIntent && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            {currentIntent}
                          </span>
                        )}
                      </div>
                      {statusDetail && (
                        <span className="text-xs text-muted-foreground">{statusDetail}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
      </div>

      {/* ── Input — sticky to bottom of flex column, not position:sticky ── */}
      <ChatInputBox
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isGenerating={isGenerating}
        onStop={() => { }}
        disabled={false}
      />
    </div>
  )
}