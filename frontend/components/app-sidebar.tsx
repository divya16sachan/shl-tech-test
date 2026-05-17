"use client"

import * as React from "react"
import {
  IconPlus,
  IconMessage,
  IconTrash,
  IconChartBar,
  IconClockHour4,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useConversations, useChatActions } from "@/hooks/useChat"
import { useEvalRuns } from "@/hooks/useEval"
import { useChatStore } from "@/store/useChatStore"
import { cn } from "@/lib/utils"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { NavUser } from "./nav-user"
import SidebarSkeleton from "./skeletons/sidebar-skeleton"

function AppSidebarInner({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: conversations, isLoading } = useConversations()
  const { data: evalRuns, isLoading: evalLoading } = useEvalRuns()
  const { deleteMutation } = useChatActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRunId = searchParams.get("run")

  // Dialog state
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
  const [pendingDeleteTitle, setPendingDeleteTitle] = React.useState<string>("")

  const isEvalPage = pathname === "/eval"

  // Close dialog automatically when deletion succeeds
  const isDeleting = deleteMutation.isPending
  const prevDeleting = React.useRef(false)
  React.useEffect(() => {
    if (prevDeleting.current && !isDeleting && !deleteMutation.isError) {
      setPendingDeleteId(null)
    }
    prevDeleting.current = isDeleting
  }, [isDeleting, deleteMutation.isError])

  function openDeleteDialog(id: string, title: string) {
    setPendingDeleteId(id)
    setPendingDeleteTitle(title)
  }

  function confirmDelete() {
    if (pendingDeleteId) {
      deleteMutation.mutate(pendingDeleteId)
    }
  }

  return (
    <>
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

          {/* ── Evaluation Dashboard link ── */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isEvalPage && !activeRunId
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <Link href="/eval">
                      <IconChartBar size={18} className="shrink-0 opacity-60" />
                      <span className="text-sm font-medium">Evaluation Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── Past eval runs (only visible on /eval) ── */}
          {isEvalPage && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px]">Past Runs</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {evalLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                      <IconLoader2 size={12} className="animate-spin" />
                      Loading runs…
                    </div>
                  ) : evalRuns?.length ? (
                    evalRuns.map((run: any) => {
                      const isActiveRun = activeRunId === run._id
                      const recall = run.summary?.meanRecall ?? 0
                      const passed = recall >= 0.8
                      const warned = recall >= 0.6 && recall < 0.8
                      return (
                        <SidebarMenuItem key={run._id}>
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              "group w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                              isActiveRun ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            )}
                          >
                            <Link href={`/eval?run=${run._id}`}>
                              {passed ? (
                                <IconCircleCheck size={14} className="shrink-0 text-emerald-500" />
                              ) : warned ? (
                                <IconCircleX size={14} className="shrink-0 text-amber-500" />
                              ) : (
                                <IconCircleX size={14} className="shrink-0 text-red-500" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  Recall {(recall * 100).toFixed(0)}%
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <IconClockHour4 size={9} />
                                  {new Date(run.runAt).toLocaleDateString(undefined, {
                                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No runs yet</p>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ── Conversation history ── */}
          <SidebarGroup>
            <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <SidebarSkeleton />
                ) : (
                  conversations?.map((chat: any) => {
                    const isActive = pathname === `/${chat._id}`
                    const isDeletingThis = isDeleting && deleteMutation.variables === chat._id
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
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openDeleteDialog(chat._id, chat.title)
                              }}
                              className={cn(
                                "p-1 transition-all",
                                isDeletingThis
                                  ? "opacity-100 text-destructive cursor-not-allowed"
                                  : "opacity-0 group-hover:opacity-100 hover:text-destructive"
                              )}
                              disabled={isDeletingThis}
                              aria-label="Delete conversation"
                            >
                              {isDeletingThis
                                ? <IconLoader2 size={14} className="animate-spin" />
                                : <IconTrash size={14} />
                              }
                            </button>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDeleteId(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">"{pendingDeleteTitle}"</span>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="default"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 size={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <React.Suspense fallback={null}>
      <AppSidebarInner {...props} />
    </React.Suspense>
  )
}
