"use client"

import * as React from "react"
import {
  IconRobot,
  IconPlus,
  IconMessage,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useConversations, useChatActions } from "@/hooks/useChat"
import { useChatStore } from "@/store/useChatStore"
import { cn } from "@/lib/utils"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: conversations, isLoading } = useConversations()
  const { deleteConversation } = useChatActions()
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconPlus className="size-4" />
                </div>
                <span className="font-semibold">New Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-4 py-2 text-xs text-muted-foreground">Loading...</div>
              ) : conversations?.map((chat: any) => {
                const isActive = pathname === `/${chat._id}`
                return (
                  <SidebarMenuItem key={chat._id}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                    >
                      <Link href={`/${chat._id}`}>
                        <IconMessage size={18} className="shrink-0 opacity-60" />
                        <span className="truncate text-sm flex-1 text-left">{chat.title}</span>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteConversation(chat._id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                        >
                          <IconTrash size={14} />
                        </button>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
