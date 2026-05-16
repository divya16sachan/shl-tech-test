import React, { useState } from "react"
import { IconChevronRight, IconSparkles, IconExternalLink, IconGlobe, IconCpu, IconDeviceDesktop, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RecommendationCardProps {
  name: string
  url: string
  category?: string
  remote_testing: boolean
  adaptive_irt: boolean
  test_types: any[]
  description: string
  searchQuery?: string
  highlight?: any
}

export function RecommendationCard({
  name,
  url,
  category,
  remote_testing,
  adaptive_irt,
  test_types,
  description,
  searchQuery,
  highlight,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Helper to render highlighted text or fallback to normal
  const renderText = (text: string, highlightedHtml?: string) => {
    if (highlightedHtml) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    }
    return <span>{text}</span>
  }

  // Helper for radius snippet
  const getSnippet = (text: string, highlightInfo?: any) => {
    if (!highlightInfo || isExpanded) {
      return renderText(text, highlightInfo?.description)
    }

    const html = highlightInfo.description
    if (!html || !html.includes("<mark>")) return renderText(text, highlightInfo?.description)

    // Calculate radius around the first match
    const radius = 100
    const firstMark = html.indexOf("<mark>")
    
    // Start index (try to keep some context before)
    let start = Math.max(0, firstMark - 40)
    // End index
    let end = Math.min(html.length, firstMark + radius)

    // Avoid cutting mid-tag (very basic check)
    const snippetRaw = html.substring(start, end)
    
    // If we cut in the middle of a <mark> tag, adjust
    if (snippetRaw.includes("<mar") && !snippetRaw.includes("<mark>")) {
      start = Math.max(0, html.lastIndexOf("<mark>", firstMark))
    }
    
    let snippet = html.substring(start, end)
    
    // Simple tag balance check for the snippet
    const openTags = (snippet.match(/<mark>/g) || []).length
    const closeTags = (snippet.match(/<\/mark>/g) || []).length
    if (openTags > closeTags) {
      snippet += " </mark>"
    }

    if (start > 0) snippet = "..." + snippet
    if (end < html.length) snippet = snippet + "..."

    return <span dangerouslySetInnerHTML={{ __html: snippet }} />
  }

  return (
    <div className="group shrink-0 relative w-full rounded-2xl overflow-hidden mt-4 border border-border bg-card/50 hover:bg-card transition-all">
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              {test_types?.map((t: any, idx: number) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {t.label}
                </span>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {renderText(name, highlight?.name)}
            </h3>
            {category && (
              <div className="text-[10px] font-medium text-muted-foreground mt-1 opacity-80">
                Category: {renderText(category, highlight?.category)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {remote_testing && (
            <div className="flex items-center gap-1">
              <IconDeviceDesktop size={14} />
              <span>Remote</span>
            </div>
          )}
          {adaptive_irt && (
            <div className="flex items-center gap-1">
              <IconCpu size={14} />
              <span>Adaptive</span>
            </div>
          )}
        </div>

        <div 
          className={cn(
            "text-sm text-muted-foreground cursor-pointer transition-all",
            !isExpanded && "line-clamp-3"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {getSnippet(description, highlight)}
        </div>

        <div className="mt-2 flex items-center justify-between pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">Show Less <IconChevronUp size={12} /></span>
            ) : (
              <span className="flex items-center gap-1">Read More <IconChevronDown size={12} /></span>
            )}
          </Button>
          
          <Button variant="link" size="sm" className="group/btn text-primary p-0 h-auto" onClick={(e) => {
            e.stopPropagation();
            window.open(url, '_blank');
          }}>
            Official SHL Link
            <IconExternalLink size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
