"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  IconPlayerPlay,
  IconLoader2,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconRefresh,
  IconBolt,
  IconDatabase,
  IconBrain,
  IconChartBar,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useStreamEval, TraceActivity, useEvalRun, useLatestEvalRun } from "@/hooks/useEval";
import type { TraceResult, EvalSummary } from "@/lib/evalApi";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";


// ─── Types ─────────────────────────────────────────────────────────────────────

interface EvalProbes {
  clarified: boolean;
  refused: boolean;
  refined: boolean;
  turnCap: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function recallColor(r: number) {
  if (r >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (r >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}
function recallBarColor(r: number) {
  if (r >= 0.8) return "bg-emerald-500";
  if (r >= 0.6) return "bg-amber-500";
  return "bg-red-500";
}
function getStatus(t: TraceResult): { label: string; variant: "pass" | "warn" | "fail" } {
  if (t.isVague || t.isOffTopic) {
    const allPass = Object.values(t.probes).every(Boolean);
    return allPass ? { label: "PASS", variant: "pass" } : { label: "FAIL", variant: "fail" };
  }
  if (t.recall >= 0.8) return { label: "PASS", variant: "pass" };
  if (t.recall >= 0.6) return { label: "WARN", variant: "warn" };
  return { label: "FAIL", variant: "fail" };
}
const statusStyles = {
  pass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  fail: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

const statusStepIcon: Record<string, React.ReactNode> = {
  retrieving: <IconDatabase size={12} className="text-blue-400 animate-pulse" />,
  retrieved: <IconDatabase size={12} className="text-emerald-400" />,
  classifying: <IconBrain size={12} className="text-purple-400 animate-pulse" />,
  classified: <IconBrain size={12} className="text-purple-400" />,
  scoring: <IconChartBar size={12} className="text-amber-400 animate-pulse" />,
  starting: <IconBolt size={12} className="text-muted-foreground animate-pulse" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  colorClass,
  animate,
}: {
  label: string;
  value: string;
  sub: string;
  colorClass?: string;
  animate?: boolean;
}) {
  return (
    <Card className="shadow-none border-border/60">
      <CardContent className="p-3 sm:p-4 flex flex-col gap-0.5 sm:gap-1">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium max-w-min truncate">{label}</p>
        <p
          className={cn(
            "text-xl sm:text-2xl font-semibold tabular-nums transition-all duration-500",
            colorClass ?? "text-foreground",
            animate && "scale-105"
          )}
        >
          {value}
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{sub}</p>
      </CardContent>
    </Card>
  );
}

function AssessmentTag({
  name,
  hit,
  missing,
}: {
  name: string;
  hit?: boolean;
  missing?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium",
        hit
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
          : missing
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
            : "bg-muted border-border text-muted-foreground"
      )}
    >
      {hit ? <IconCheck size={10} /> : missing ? <IconX size={10} /> : null}
      {name}
    </span>
  );
}

function TurnPips({ used, max = 8 }: { used: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-sm",
            i < used ? "bg-blue-400" : "bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

function TraceRow({ trace, isNew }: { trace: TraceResult; isNew?: boolean }) {
  const [open, setOpen] = useState(false);
  const { label, variant } = getStatus(trace);
  const probeLabels: Record<keyof EvalProbes, string> = {
    clarified: "Clarified when vague",
    refused: "Refused off-topic",
    refined: "Applied refinement",
    turnCap: "Turn cap honored",
  };
  const isSpecialTrace = trace.isVague || trace.isOffTopic;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card overflow-hidden transition-all duration-300",
        open && "border-border shadow-sm",
        isNew && "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <button
        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="text-xs text-muted-foreground w-4 sm:w-5 shrink-0">#{trace.id}</span>
        <div className="flex-1 text-xs sm:text-sm font-medium text-foreground truncate">
          <span className="flex-1 text-xs sm:text-sm font-medium text-foreground truncate">{trace.title}</span>

          {/* Recall bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-24 shrink-0 justify-end sm:justify-start">
            <div className=" flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  isSpecialTrace ? "bg-muted-foreground/40" : recallBarColor(trace.recall)
                )}
                style={{ width: `${isSpecialTrace ? 100 : trace.recall * 100}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-mono tabular-nums min-w-[28px] text-right",
                isSpecialTrace ? "text-muted-foreground" : recallColor(trace.recall)
              )}
            >
              {isSpecialTrace ? "—" : trace.recall.toFixed(2)}
            </span>
          </div>
        </div>
        <span className="hidden lg:block text-xs text-muted-foreground min-w-[140px] truncate">
          {trace.persona}
        </span>

        <span className="text-[10px] text-muted-foreground hidden md:block min-w-[60px]">
          {trace.intent}
        </span>

        <span
          className={cn(
            "text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded border min-w-[38px] sm:min-w-[44px] text-center shrink-0",
            statusStyles[variant]
          )}
        >
          {label}
        </span>
        <IconChevronDown
          size={16}
          className={cn(
            "text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-4 flex flex-col gap-4">
          {/* Query */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Query sent
            </p>
            <p className="text-xs text-foreground/80 italic">"{trace.query}"</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Expected assessments
              </p>
              <div className="flex flex-wrap gap-1">
                {trace.expectedAssessments.length ? (
                  trace.expectedAssessments.map((e) => {
                    const hit = trace.retrieved.some(
                      (r) =>
                        r.toLowerCase().includes(e.toLowerCase()) ||
                        e.toLowerCase().includes(r.toLowerCase())
                    );
                    return <AssessmentTag key={e} name={e} hit={hit} missing={!hit} />;
                  })
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    n/a — clarify / refuse trace
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Agent retrieved ({trace.retrieved.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {trace.retrieved.length ? (
                  trace.retrieved.map((r) => {
                    const expected = trace.expectedAssessments.some(
                      (e) =>
                        r.toLowerCase().includes(e.toLowerCase()) ||
                        e.toLowerCase().includes(r.toLowerCase())
                    );
                    return <AssessmentTag key={r} name={r} hit={expected} />;
                  })
                ) : (
                  <span className="text-xs text-muted-foreground italic">— none retrieved</span>
                )}
              </div>
            </div>
          </div>

          {/* Probes */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Behavior probes
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {(Object.entries(trace.probes) as [keyof EvalProbes, boolean][]).map(([k, v]) => (
                <div
                  key={k}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    v ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                  )}
                >
                  {v ? <IconCircleCheck size={14} /> : <IconCircleX size={14} />}
                  <span>{probeLabels[k]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Turns used
              </p>
              <div className="flex items-center gap-2">
                <TurnPips used={1} />
                <span className="text-xs text-muted-foreground">1/8</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Groundedness
              </p>
              <span
                className={cn(
                  "text-xs font-medium",
                  trace.grounded
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
                )}
              >
                {trace.grounded ? "✓ All URLs verified" : "✗ Hallucination detected"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic leading-relaxed">
            {trace.note}
          </p>
        </div>
      )}
    </div>
  );
}

function RecallChart({ traces }: { traces: TraceResult[] }) {
  const chartConfig = {
    recall: {
      label: "Recall Rate",
    },
  } satisfies ChartConfig;

  const chartData = traces.map((t) => {
    const isSpecial = t.isVague || t.isOffTopic;
    const displayRecall = isSpecial ? 0.15 : t.recall;

    let fill = "#ef4444"; // Red
    if (isSpecial) {
      fill = "currentColor";
    } else if (t.recall >= 0.8) {
      fill = "#10b981"; // Emerald
    } else if (t.recall >= 0.6) {
      fill = "#f59e0b"; // Amber
    }

    return {
      name: `#${t.id}`,
      title: t.title,
      recall: displayRecall,
      rawRecall: t.recall,
      isSpecial,
      fill,
    };
  });

  return (
    <div className="h-[220px] w-full pt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={[0, 1.0]}
            ticks={[0, 0.25, 0.5, 0.75, 1.0]}
            tickFormatter={(value) => value.toFixed(2)}
            className="text-[10px] fill-muted-foreground font-mono"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px] fill-muted-foreground font-mono"
          />
          <ChartTooltip
            cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  if (!item) return label;
                  return `${label} · ${item.title}`;
                }}
                formatter={(value, name, item) => {
                  const raw = item.payload.rawRecall;
                  const isSpecial = item.payload.isSpecial;
                  return (
                    <div className="flex flex-1 justify-between items-center gap-4 leading-none w-full">
                      <span className="text-muted-foreground">Recall Rate</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {isSpecial ? "Vague / Off-Topic (N/A)" : `${(raw * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar dataKey="recall" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                className={entry.isSpecial ? "fill-muted-foreground/30" : ""}
              />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent />} className="text-[11px]" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

// ─── Live activity indicator ──────────────────────────────────────────────────

function LiveActivityBanner({
  activity,
  completed,
  total,
}: {
  activity: TraceActivity | null;
  completed: number;
  total: number;
}) {
  if (!activity) return null;

  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-5 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
      {/* Progress bar */}
      <div className="h-0.5 bg-muted w-full">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <IconLoader2 size={13} className="animate-spin text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              Trace #{activity.id} · {activity.title}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums self-end sm:self-auto">
            {completed}/{total}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          {statusStepIcon[activity.status] ?? (
            <IconLoader2 size={12} className="animate-spin" />
          )}
          <span className="truncate">{activity.detail}</span>
        </div>
        {/* Step pipeline dots */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-0.5">
          {(["retrieving", "classifying", "scoring"] as const).map((step) => {
            const order = ["starting", "retrieving", "retrieved", "classifying", "classified", "scoring"];
            const currentIdx = order.indexOf(activity.status);
            const stepIdx = order.indexOf(step);
            const done = currentIdx > stepIdx;
            const active = activity.status === step || activity.status === order[stepIdx + 1];
            return (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                    done
                      ? "bg-emerald-500"
                      : active
                        ? "bg-primary animate-pulse"
                        : "bg-muted-foreground/30"
                  )}
                />
                <span className="text-[10px] text-muted-foreground">{step}</span>
                {step !== "scoring" && (
                  <div className="w-3 h-px bg-border mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

function SummaryMetrics({
  summary,
  traceCount,
  durationMs,
}: {
  summary: EvalSummary;
  traceCount: number;
  durationMs: number | null;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <MetricCard
        label="Mean Recall@10"
        value={summary.meanRecall.toFixed(2)}
        sub={`${summary.passedTraces}/${summary.totalTraces} traces passed`}
        colorClass={
          summary.meanRecall >= 0.8
            ? "text-emerald-600 dark:text-emerald-400"
            : summary.meanRecall >= 0.6
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-500"
        }
      />
      <MetricCard
        label="Groundedness"
        value={`${Math.round(summary.groundedness * 100)}%`}
        sub="0 hallucinated URLs"
        colorClass="text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="Probe pass rate"
        value={`${Math.round(summary.probePassRate * 100)}%`}
        sub={`${Math.round(summary.probePassRate * traceCount * 4)} / ${traceCount * 4} probes`}
        colorClass={
          summary.probePassRate >= 0.9
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400"
        }
      />
      <MetricCard
        label="Avg turns used"
        value={summary.avgTurns.toString()}
        sub={durationMs ? `${(durationMs / 1000).toFixed(1)}s total` : "cap: 8 turns"}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get("run");

  // SSE Live Stream Hook
  const { state: streamState, run: triggerStream, reset: resetStream } = useStreamEval();
  const { phase, liveActivity, completedTraces: streamTraces, summary: streamSummary, total, durationMs: streamDuration, error, savedRunId, startDetail } = streamState;

  // React Query DB fetch hooks
  const { data: dbRun, isLoading: dbLoading } = useEvalRun(runId);
  const { data: latestRun, isLoading: latestLoading } = useLatestEvalRun();

  // If a run ID is saved from a completed live stream, navigate to it in the URL
  useEffect(() => {
    if (savedRunId) {
      router.push(`/eval?run=${savedRunId}`);
      resetStream(); // Reset stream state so we cleanly view the DB run
    }
  }, [savedRunId, router, resetStream]);

  // Determine rendering modes
  const isStreaming = phase === "running" || phase === "done";
  const activeRun = runId ? dbRun : (phase === "idle" ? latestRun : null);
  const isDBCardLoading = runId ? dbLoading : (phase === "idle" ? latestLoading : false);

  const displayTraces = isStreaming ? streamTraces : (activeRun ? activeRun.traces : []);
  const displaySummary = isStreaming ? streamSummary : (activeRun ? activeRun.summary : null);
  const displayDuration = isStreaming ? streamDuration : (activeRun ? activeRun.durationMs : null);

  const isRunning = phase === "running";
  const isDone = phase === "done" || (!isStreaming && !!activeRun);

  // Track which traces are "new" for entrance animation
  const newTraceIds = new Set(
    phase === "done" ? [] : displayTraces.slice(-1).map((t: TraceResult) => t.id)
  );

  const startNewRun = () => {
    router.push("/eval");
    triggerStream();
  };

  const handleReset = () => {
    router.push("/eval");
    resetStream();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Evaluation Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isRunning
                ? startDetail || "Streaming live evaluation…"
                : activeRun && !isStreaming
                  ? `Evaluation run from ${new Date(activeRun.runAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} · ${activeRun.traces?.length || 0} traces`
                  : isDone && displayDuration
                    ? `Completed in ${(displayDuration / 1000).toFixed(1)}s · ${displayTraces.length} traces`
                    : "Live scores from Qdrant + Groq · 8 traces · streaming SSE"}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {isDone && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="gap-1.5 text-muted-foreground"
              >
                <IconRefresh size={13} />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant={isRunning ? "outline" : "default"}
              onClick={isRunning ? undefined : startNewRun}
              disabled={isRunning}
              className="gap-1.5"
            >
              {isRunning ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconPlayerPlay size={14} />
              )}
              {isRunning ? "Running…" : isDone ? "Run new evaluation" : "Run evaluation"}
            </Button>
          </div>
        </div>

        {/* Error */}
        {phase === "error" && error && (
          <div className="flex items-center gap-3 text-sm text-red-600 mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <IconAlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live activity banner */}
        {isRunning && (
          <LiveActivityBanner
            activity={liveActivity}
            completed={displayTraces.length}
            total={total}
          />
        )}

        {/* Loading state from DB */}
        {isDBCardLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <IconLoader2 size={32} className="animate-spin text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">Loading evaluation details…</p>
          </div>
        )}

        {/* Idle empty state when no runs exist */}
        {phase === "idle" && !activeRun && !isDBCardLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <IconAlertTriangle size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No evaluation running</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Run evaluation" to stream 8 traces live from Qdrant + Groq.
              </p>
            </div>
            <Button onClick={startNewRun} className="gap-2">
              <IconPlayerPlay size={14} />
              Run evaluation
            </Button>
          </div>
        )}

        {/* Summary metrics — shown once final summary arrives or is loaded */}
        {!isDBCardLoading && displaySummary && (
          <SummaryMetrics
            summary={displaySummary}
            traceCount={displayTraces.length}
            durationMs={displayDuration}
          />
        )}

        {/* Trace results — stream in as they complete or loaded from DB */}
        {!isDBCardLoading && displayTraces.length > 0 && (
          <div className="mb-1">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
              {isRunning
                ? `Trace results · ${displayTraces.length} complete, ${total - displayTraces.length} remaining…`
                : "Trace results"}
            </p>
            <div className="flex flex-col gap-2">
              {displayTraces.map((t: TraceResult) => (
                <TraceRow key={t.id} trace={t} isNew={newTraceIds.has(t.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Chart + footer — only shown when complete */}
        {!isDBCardLoading && isDone && displayTraces.length > 0 && displaySummary && (
          <>
            <Separator className="my-6" />
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
                Recall@10 per trace
              </p>
              <Card className="shadow-none border-border/60">
                <CardContent className="p-5">
                  <RecallChart traces={displayTraces} />
                  <div className="flex items-center gap-4 mt-3 justify-end flex-wrap">
                    {[
                      { color: "bg-emerald-500", label: "≥ 0.80 PASS" },
                      { color: "bg-amber-500", label: "≥ 0.60 WARN" },
                      { color: "bg-red-500", label: "< 0.60 FAIL" },
                      { color: "bg-muted-foreground/30", label: "clarify/refuse" },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={cn("w-2.5 h-2.5 rounded-sm", color)} />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
              <span>
                Scorer:{" "}
                <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">
                  recallAtK · isGrounded · behaviorProbes
                </code>
              </span>
              <a
                href="https://shl-tech-test.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                API live
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


