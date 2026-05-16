"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { RecommendationsPanel } from "@/components/recommendations-panel"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/store/useChatStore"
import { Button } from "@/components/ui/button"
import { IconLayoutSidebarRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { ModeToggle } from "@/components/ui/mode-toggle"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isRecommendationsOpen, setRecommendationsOpen, recommendations } = useChatStore()
  const isMobile = useIsMobile()
  const hasRecommendations = recommendations && recommendations.length > 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-row bg-background">
        <div className="flex flex-col flex-1 border-r border-border relative">
          <header className="flex h-14 sticky top-0 shrink-0 items-center justify-between gap-2 px-4 border-b border-border bg-background/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-2" />
              <span className="text-sm font-medium truncate">SHL AI Recruiter Assistant</span>
            </div>
            <div className="flex gap-2 items-center">
              <ModeToggle />
              {hasRecommendations && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRecommendationsOpen(!isRecommendationsOpen)}
                >
                  <IconLayoutSidebarRight />
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>

        

        {/* Mobile Sidebar (Sheet) */}
        {isMobile && hasRecommendations && (
          <Sheet open={isRecommendationsOpen} onOpenChange={setRecommendationsOpen}>
            <SheetContent side="right" className="p-0 w-[85%] sm:w-[400px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Recommendations</SheetTitle>
              </SheetHeader>
              <RecommendationsPanel />
            </SheetContent>
          </Sheet>
        )}
      </SidebarInset>
      {/* Desktop Sidebar */}
        {!isMobile && hasRecommendations && (
          <aside
            className={cn(
              "flex flex-col sticky top-0 shrink-0 bg-sidebar h-svh border-l border-border transition-all duration-300 ease-in-out",
              isRecommendationsOpen ? "w-[350px]" : "w-0 border-l-0 overflow-hidden"
            )}
          >
            <div className="w-[350px] h-full">
              <RecommendationsPanel />
            </div>
          </aside>
        )}
    </SidebarProvider>
  )
}
