"use client"

import {
    SidebarTrigger
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { IconChevronRight, IconLayoutSidebarRight } from "@tabler/icons-react"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useChatStore } from "@/store/useChatStore"
import Link from "next/link"
import LogoIcon from "./icons/logo"
import { BreadcrumbSeparator } from "./ui/breadcrumb"

import { usePathname } from "next/navigation"

const AppHeader = () => {
    const pathname = usePathname()
    const { isRecommendationsOpen, setRecommendationsOpen, recommendations } = useChatStore()
    const isEvalPage = pathname?.startsWith("/eval")
    const hasRecommendations = !isEvalPage && recommendations && recommendations.length > 0;

    return (
        <header className="flex h-14 sticky top-0 shrink-0 items-center justify-between gap-2 px-4 border-b border-border bg-background/90 backdrop-blur-md z-30">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2" />
                <Link href="/" className="size-7 bg-primary rounded-md flex items-center justify-center ">
                    <LogoIcon className="size-6.5" color="#fff" />
                </Link>
                <IconChevronRight className="size-4"/>
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
    )
}

export default AppHeader