"use client"

import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import hljs from 'highlight.js'
import { useChatStore } from "@/store/useChatStore"
import { Button } from "./ui/button"
import { IconCopy, IconCheck, IconSparkles, IconArrowUpRight } from "@tabler/icons-react"

type MessageProps = {
  message: {
    role: "user" | "assistant"
    content: string
    isStreaming?: boolean
    recommendations?: any[]
  }
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (typeof window === "undefined") return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Highlight the code
  const highlightedCode = language && hljs.getLanguage(language)
    ? hljs.highlight(value, { language }).value
    : hljs.highlightAuto(value).value

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="lang-badge">{language || "code"}</span>
        <button onClick={copyToClipboard} className="code-block-copy-btn">
          {copied ? (
            <>
              <IconCheck size={14} className="text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code 
          className={`hljs language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  )
}

import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export function ChatMessage({ message }: MessageProps) {
  const isAssistant = message.role === "assistant"
  const { setRecommendations, setRecommendationsOpen } = useChatStore()

  return (
    <div className={`flex gap-4 w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div 
        className={`relative rounded-2xl text-[15px] leading-relaxed ${
          isAssistant 
            ? "bg-transparent text-foreground/90" 
            : "bg-muted text-foreground border border-border shadow-sm px-5 py-3 max-w-[85%]"
        }`}
      >
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              table({ children }) {
                return (
                  <div className="table-wrapper">
                    <table>{children}</table>
                  </div>
                )
              },
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <CodeBlock 
                    language={match[1]} 
                    value={String(children).replace(/\n$/, '')} 
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
          )}

          {isAssistant && message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                // variant="outline"
                size="sm"
                className="gap-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => {
                  setRecommendations(message.recommendations!)
                  setRecommendationsOpen(true)
                }}
              >
                View Recommended Assessments ({message.recommendations.length})
                <IconArrowUpRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
