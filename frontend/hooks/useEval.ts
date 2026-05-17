import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useState, useRef } from 'react';
import {
  fetchEvalRuns,
  fetchEvalRun,
  fetchLatestEvalRun,
  streamEval,
  TraceResult,
  EvalSummary,
} from '@/lib/evalApi';

// ─── Saved run REST hooks ─────────────────────────────────────────────────────

export const useEvalRuns = () =>
  useQuery({
    queryKey: ['eval-runs'],
    queryFn: fetchEvalRuns,
    staleTime: 30_000,
  });

export const useLatestEvalRun = () =>
  useQuery({
    queryKey: ['eval-run', 'latest'],
    queryFn: fetchLatestEvalRun,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });

export const useEvalRun = (id: string | null) =>
  useQuery({
    queryKey: ['eval-run', id],
    queryFn: () => fetchEvalRun(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });

// ─── Live SSE streaming hook ──────────────────────────────────────────────────

export interface TraceActivity {
  id: number;
  title: string;
  persona: string;
  status: string;   // 'starting' | 'retrieving' | 'retrieved' | 'classifying' | 'classified' | 'scoring' | 'done'
  detail: string;
}

export interface StreamEvalState {
  phase: 'idle' | 'running' | 'done' | 'error';
  total: number;
  liveActivity: TraceActivity | null;   // the trace currently being processed
  completedTraces: TraceResult[];
  summary: EvalSummary | null;
  durationMs: number | null;
  savedRunId: string | null;
  error: string | null;
  startDetail: string;
}

export function useStreamEval() {
  const qc = useQueryClient();
  const abortRef = useRef<boolean>(false);

  const [state, setState] = useState<StreamEvalState>({
    phase: 'idle',
    total: 0,
    liveActivity: null,
    completedTraces: [],
    summary: null,
    durationMs: null,
    savedRunId: null,
    error: null,
    startDetail: '',
  });

  const run = useCallback(async () => {
    abortRef.current = false;

    setState({
      phase: 'running',
      total: 0,
      liveActivity: null,
      completedTraces: [],
      summary: null,
      durationMs: null,
      savedRunId: null,
      error: null,
      startDetail: '',
    });

    await streamEval({
      onStart(total, detail) {
        setState((s) => ({ ...s, total, startDetail: detail }));
      },

      onTraceStart(id, title, persona) {
        setState((s) => ({
          ...s,
          liveActivity: { id, title, persona, status: 'starting', detail: `Starting "${title}"…` },
        }));
      },

      onTraceStatus(id, status, detail) {
        setState((s) => ({
          ...s,
          liveActivity: s.liveActivity ? { ...s.liveActivity, status, detail } : null,
        }));
      },

      onTraceComplete(trace) {
        setState((s) => ({
          ...s,
          liveActivity: null,
          completedTraces: [...s.completedTraces, trace],
        }));
      },

      onComplete(summary, durationMs) {
        setState((s) => ({
          ...s,
          phase: 'done',
          liveActivity: null,
          summary,
          durationMs,
        }));
      },

      onSaved(runId) {
        setState((s) => ({ ...s, savedRunId: runId }));
        qc.invalidateQueries({ queryKey: ['eval-runs'] });
        qc.invalidateQueries({ queryKey: ['eval-run', 'latest'] });
      },

      onError(error) {
        setState((s) => ({ ...s, phase: 'error', error }));
      },
    });
  }, [qc]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({
      phase: 'idle',
      total: 0,
      liveActivity: null,
      completedTraces: [],
      summary: null,
      durationMs: null,
      savedRunId: null,
      error: null,
      startDetail: '',
    });
  }, []);

  return { state, run, reset };
}


// ─── Legacy mutation for saved-run workflow (POST /eval/run → DB) ─────────────

export const useRunEval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const axios = (await import('axios')).default;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${API_URL}/eval/run`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eval-runs'] });
      qc.invalidateQueries({ queryKey: ['eval-run', 'latest'] });
    },
  });
};

