// lib/evalApi.ts
// Consumes GET /eval SSE stream and fires callbacks per event type

import { api } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TraceResult {
  id: number;
  title: string;
  query: string;
  persona: string;
  isVague: boolean;
  isOffTopic: boolean;
  expectedAssessments: string[];
  retrieved: string[];
  recall: number;
  grounded: boolean;
  intent: string;
  probes: {
    clarified: boolean;
    refused: boolean;
    refined: boolean;
    turnCap: boolean;
  };
  note: string;
}

export interface EvalSummary {
  meanRecall: number;
  groundedness: number;
  probePassRate: number;
  avgTurns: number;
  totalTraces: number;
  passedTraces: number;
}

export interface EvalCallbacks {
  onStart?: (total: number, detail: string) => void;
  onTraceStart?: (id: number, title: string, persona: string) => void;
  onTraceStatus?: (id: number, status: string, detail: string, extra?: Record<string, unknown>) => void;
  onTraceComplete?: (trace: TraceResult) => void;
  onComplete?: (summary: EvalSummary, durationMs: number) => void;
  onSaved?: (runId: string) => void;
  onError?: (error: string) => void;
}

// ─── SSE streaming function ───────────────────────────────────────────────────

export async function streamEval(
  callbacks: EvalCallbacks
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/eval`, {
      method: 'GET',
      headers: { Accept: 'text/event-stream' },
    });
  } catch (err) {
    callbacks.onError?.(`Network error: ${String(err)}`);
    return;
  }

  if (!res.ok || !res.body) {
    callbacks.onError?.(`Failed to connect: ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;

      try {
        const event = JSON.parse(raw);

        switch (event.type) {
          case 'eval_start':
            callbacks.onStart?.(event.total, event.detail);
            break;

          case 'trace_start':
            callbacks.onTraceStart?.(event.id, event.title, event.persona);
            break;

          case 'trace_status':
            callbacks.onTraceStatus?.(event.id, event.status, event.detail, event);
            break;

          case 'trace_complete':
            callbacks.onTraceComplete?.(event.trace as TraceResult);
            break;

          case 'eval_complete':
            callbacks.onComplete?.(event.summary as EvalSummary, event.durationMs);
            break;

          case 'saved':
            callbacks.onSaved?.(event.runId as string);
            break;

          case 'error':
            callbacks.onError?.(event.detail ?? 'Unknown error');
            break;
        }
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}

// ─── REST helpers (for history / saved runs) ──────────────────────────────────

const BASE = '/eval';

export const fetchEvalRuns = async () => {
  const { data } = await api.get(`${BASE}/runs`);
  return data;
};

export const fetchLatestEvalRun = async () => {
  const { data } = await api.get(`${BASE}/runs/latest`);
  return data;
};

export const fetchEvalRun = async (id: string) => {
  const { data } = await api.get(`${BASE}/runs/${id}`);
  return data;
};
