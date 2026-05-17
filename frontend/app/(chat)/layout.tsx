"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { RecommendationsPanel } from "@/components/recommendations-panel"
import {
  SidebarInset,
  SidebarProvider
} from "@/components/ui/sidebar"
import { useChatStore } from "@/store/useChatStore"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile, useIsLargeScreen } from "@/hooks/use-mobile"
import AppHeader from "@/components/app-header"
import { usePathname } from "next/navigation"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isRecommendationsOpen, setRecommendationsOpen, recommendations } = useChatStore()
  const isMobile = useIsMobile()
  const isLargeScreen = useIsLargeScreen()
  const isEvalPage = pathname?.startsWith("/eval")
  const hasRecommendations = !isEvalPage && recommendations && recommendations.length > 0

  // If we are on smaller screen, default the sheet to closed on initial load/resize
  useEffect(() => {
    if (!isLargeScreen) {
      setRecommendationsOpen(false)
    }
  }, [isLargeScreen, setRecommendationsOpen])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-row bg-background">
        <div className="flex flex-col flex-1 border-r border-border relative">
          <AppHeader/>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>

        

        {/* Mobile/Tablet Sidebar (Sheet) */}
        {!isLargeScreen && hasRecommendations && (
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
      {/* Desktop Sidebar (Aside) */}
        {isLargeScreen && hasRecommendations && (
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
