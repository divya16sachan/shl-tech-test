import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─── User message skeleton (right-aligned bubble) ────────────────────────────

function UserMessageSkeleton() {
  return (
    <div className="flex gap-4 w-full justify-end">
      <div className="relative rounded-2xl px-5 py-3 max-w-[85%] bg-muted border border-border shadow-sm">
        <Skeleton className="h-12 w-64" />
      </div>
    </div>
  )
}

// ─── Assistant message skeleton (left-aligned, matches markdown-content) ─────

function AssistantMessageSkeleton() {
  return (
    <div className="flex gap-4 w-full justify-start">
      <div className="relative rounded-2xl text-[15px] leading-relaxed bg-transparent max-w-[85%] w-full space-y-4">


        {/* h2 italic — What are React Hooks? */}
        <Skeleton className="h-6 w-48" />

        {/* paragraph — 2 lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[80%]" />
        </div>

        {/* h2 bold — Types of React Hooks */}
        <Skeleton className="h-6 w-52" />

        {/* paragraph */}
        <Skeleton className="h-4 w-64" />

        {/* nested bullet list */}
        <div className="space-y-3 pl-2">
          {/* State Hooks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-1.5 pl-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>

          {/* Effect Hooks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
              <Skeleton className="h-4 w-52" />
            </div>
            <div className="space-y-1.5 pl-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-80" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
          </div>

          {/* Context Hooks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-1.5 pl-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Full chat skeleton ───────────────────────────────────────────────────────

export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6 max-w-3xl mx-auto px-5 pt-5 pb-8 animate-pulse", className)}>
      <UserMessageSkeleton />
      <AssistantMessageSkeleton />
    </div>
  )
}

// ─── Compact variant — for sidebar / history list ─────────────────────────────

export function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-2 py-2">
          <Skeleton className="h-4" style={{ width: `${60 + (i % 3) * 15}%` }} />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}