
"use client"

import {
    IconClockHour4,
    IconCircleCheck,
    IconCircleX,
    IconLoader2,
    IconHistory,
    IconChevronRight
} from "@tabler/icons-react"

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, SidebarGroup,
    SidebarGroupLabel, SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import Link from "next/link"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"


interface NavEvalProps {
    evalLoading: boolean;
    evalRuns: any[] | undefined;
    activeRunId: string | null;
}

const NavEval = ({ evalLoading, evalRuns, activeRunId }: NavEvalProps) => {
    return (
        <SidebarMenu>
            <Collapsible defaultOpen className="group/collapsible whitespace-nowrap">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip="Past Runs">
                            <IconHistory size={16} />
                            <span>Past Runs</span>

                            <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <SidebarMenuSub>
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
                                        <SidebarMenuSubItem key={run._id}>
                                            <SidebarMenuSubButton asChild>
                                                <Link
                                                    href={`/eval?run=${run._id}`}
                                                    className={cn(
                                                        "flex h-auto items-center gap-2",
                                                        isActiveRun && "bg-accent text-accent-foreground"
                                                    )}
                                                >
                                                    {passed ? (
                                                        <IconCircleCheck
                                                            size={14}
                                                            className="shrink-0 text-emerald-500"
                                                        />
                                                    ) : warned ? (
                                                        <IconCircleX
                                                            size={14}
                                                            className="shrink-0 text-amber-500"
                                                        />
                                                    ) : (
                                                        <IconCircleX
                                                            size={14}
                                                            className="shrink-0 text-red-500"
                                                        />
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium truncate">
                                                            Recall {(recall * 100).toFixed(0)}%
                                                        </div>

                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <IconClockHour4 size={9} />

                                                            {new Date(run.runAt).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )
                                })
                            ) : (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    No runs yet
                                </p>
                            )}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        </SidebarMenu>
    )
}

export default NavEval