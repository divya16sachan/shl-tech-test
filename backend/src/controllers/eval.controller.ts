import { Request, Response } from 'express';
import { EvalRun } from '../models/EvalRun.js';
import { TRACE_DEFINITIONS, recallAtK, isGrounded, buildNote, classifyIntent } from '../services/eval.service.js';
import { searchAssessments } from '../services/qdrant.service.js';
import { IEvalTrace, IEvalSummary } from '../models/EvalRun.js';

// ─── POST /eval/run ───────────────────────────────────────────────────────────
// Runs evaluation, saves to DB, returns full run.

export async function runEval(_req: Request, res: Response) {
  try {
    const startTime = Date.now();
    const completedTraces: IEvalTrace[] = [];

    for (const def of TRACE_DEFINITIONS) {
      const retrieved = await searchAssessments(def.query, 10);
      const retrievedNames = retrieved.map((r) => r.name);
      const intent = await classifyIntent(def.query);
      const recall = recallAtK(retrievedNames, def.expectedAssessments);
      const grounded = isGrounded(retrieved);

      const probes = {
        clarified: def.isVague ? intent === 'clarify' : true,
        refused: def.isOffTopic ? intent === 'off_topic' : true,
        refined: def.expectedIntent === 'refine' ? intent === 'refine' : true,
        turnCap: true,
      };

      const note = buildNote(def, retrievedNames, recall, intent);

      completedTraces.push({
        id: def.id, title: def.title, query: def.query, persona: def.persona,
        isVague: def.isVague, isOffTopic: def.isOffTopic,
        expectedAssessments: def.expectedAssessments, retrieved: retrievedNames,
        recall, grounded, intent, probes, note,
      });
    }

    const nonVague = completedTraces.filter((t) => !t.isVague && !t.isOffTopic);
    const meanRecall = nonVague.length > 0
      ? nonVague.reduce((s, t) => s + t.recall, 0) / nonVague.length : 1.0;
    const groundedness = completedTraces.filter((t) => t.grounded).length / completedTraces.length;
    const totalProbes = completedTraces.length * 4;
    const passedProbes = completedTraces.reduce(
      (s, t) => s + Object.values(t.probes).filter(Boolean).length, 0
    );
    const passedTraces = completedTraces.filter((t) => {
      if (t.isVague || t.isOffTopic) return Object.values(t.probes).every(Boolean);
      return t.recall >= 0.8;
    }).length;

    const summary: IEvalSummary = {
      meanRecall: Math.round(meanRecall * 1000) / 1000,
      groundedness: Math.round(groundedness * 1000) / 1000,
      probePassRate: Math.round((passedProbes / totalProbes) * 1000) / 1000,
      avgTurns: 1,
      totalTraces: completedTraces.length,
      passedTraces,
    };

    const saved = await EvalRun.create({
      runAt: new Date(),
      summary,
      traces: completedTraces,
      durationMs: Date.now() - startTime,
    });

    res.json(saved);
  } catch (error) {
    console.error('Eval run error:', error);
    res.status(500).json({ error: 'Evaluation failed. Check server logs.' });
  }
}

// ─── GET /eval/runs ───────────────────────────────────────────────────────────
// Returns list of past runs (summary only, no trace detail) newest-first.

export async function listEvalRuns(req: Request, res: Response) {
  try {
    const runs = await EvalRun.find(
      {},
      { summary: 1, runAt: 1, durationMs: 1 } // projection — no traces array
    )
      .sort({ runAt: -1 })
      .limit(20);

    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list evaluation runs' });
  }
}

// ─── GET /eval/runs/latest ────────────────────────────────────────────────────
// Convenience shortcut — returns the most recent full run.

export async function getLatestEvalRun(req: Request, res: Response) {
  try {
    const run = await EvalRun.findOne().sort({ runAt: -1 });
    if (!run) return res.status(404).json({ error: 'No evaluation runs found' });
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest evaluation run' });
  }
}

// ─── GET /eval/runs/:id ───────────────────────────────────────────────────────
// Returns a specific run with full trace detail.

export async function getEvalRun(req: Request, res: Response) {
  try {
    const run = await EvalRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Evaluation run not found' });
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evaluation run' });
  }
}

// ─── GET /eval ────────────────────────────────────────────────────────────────
// SSE stream: runs all traces live, emitting events per trace.
// Does NOT persist to DB — use POST /eval/run for that.

function send(res: Response, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function handleEval(_req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const startTime = Date.now();
  const completedTraces: IEvalTrace[] = [];

  send(res, {
    type: 'eval_start',
    total: TRACE_DEFINITIONS.length,
    detail: `Starting evaluation of ${TRACE_DEFINITIONS.length} traces…`,
  });

  for (const def of TRACE_DEFINITIONS) {
    // 1. Signal trace started
    send(res, {
      type: 'trace_start',
      id: def.id,
      title: def.title,
      persona: def.persona,
      detail: `[${def.id}/${TRACE_DEFINITIONS.length}] Starting: "${def.title}"`,
    });

    // 2. Vector search
    send(res, {
      type: 'trace_status',
      id: def.id,
      status: 'retrieving',
      detail: `Searching Qdrant for: "${def.query.slice(0, 60)}…"`,
    });

    const retrieved = await searchAssessments(def.query, 10);
    const retrievedNames = retrieved.map((r) => r.name);

    send(res, {
      type: 'trace_status',
      id: def.id,
      status: 'retrieved',
      detail: `Found ${retrieved.length} assessments from catalog`,
      retrievedNames,
    });

    // 3. Intent classification
    send(res, {
      type: 'trace_status',
      id: def.id,
      status: 'classifying',
      detail: 'Classifying query intent…',
    });

    const intent = await classifyIntent(def.query);

    send(res, {
      type: 'trace_status',
      id: def.id,
      status: 'classified',
      detail: `Intent: ${intent}  (expected: ${def.expectedIntent})`,
      intent,
      expectedIntent: def.expectedIntent,
      intentMatch: intent === def.expectedIntent,
    });

    // 4. Score
    send(res, {
      type: 'trace_status',
      id: def.id,
      status: 'scoring',
      detail: 'Computing Recall@10, groundedness, behavior probes…',
    });

    const recall = recallAtK(retrievedNames, def.expectedAssessments);
    const grounded = isGrounded(retrieved);

    const probes = {
      clarified: def.isVague ? intent === 'clarify' : true,
      refused: def.isOffTopic ? intent === 'off_topic' : true,
      refined: def.expectedIntent === 'refine' ? intent === 'refine' : true,
      turnCap: true,
    };

    const note = buildNote(def, retrievedNames, recall, intent);

    const traceResult: IEvalTrace = {
      id: def.id,
      title: def.title,
      query: def.query,
      persona: def.persona,
      isVague: def.isVague,
      isOffTopic: def.isOffTopic,
      expectedAssessments: def.expectedAssessments,
      retrieved: retrievedNames,
      recall,
      grounded,
      intent,
      probes,
      note,
    };

    completedTraces.push(traceResult);

    // 5. Emit completed trace immediately
    send(res, {
      type: 'trace_complete',
      id: def.id,
      trace: traceResult,
      detail: `[${def.id}/${TRACE_DEFINITIONS.length}] Done — Recall: ${recall.toFixed(2)}, Intent: ${intent === def.expectedIntent ? '✓' : '✗'} ${intent}`,
    });
  }

  // ── Summary after all traces ──
  const nonVague = completedTraces.filter((t) => !t.isVague && !t.isOffTopic);
  const meanRecall =
    nonVague.length > 0
      ? nonVague.reduce((s, t) => s + t.recall, 0) / nonVague.length
      : 1.0;

  const groundedness =
    completedTraces.filter((t) => t.grounded).length / completedTraces.length;

  const totalProbes = completedTraces.length * 4;
  const passedProbes = completedTraces.reduce(
    (s, t) => s + Object.values(t.probes).filter(Boolean).length,
    0
  );

  const passedTraces = completedTraces.filter((t) => {
    if (t.isVague || t.isOffTopic) return Object.values(t.probes).every(Boolean);
    return t.recall >= 0.8;
  }).length;

  const summary: IEvalSummary = {
    meanRecall: Math.round(meanRecall * 1000) / 1000,
    groundedness: Math.round(groundedness * 1000) / 1000,
    probePassRate: Math.round((passedProbes / totalProbes) * 1000) / 1000,
    avgTurns: 1,
    totalTraces: completedTraces.length,
    passedTraces,
  };

  const durationMs = Date.now() - startTime;

  send(res, {
    type: 'eval_complete',
    summary,
    durationMs,
    detail: `Evaluation complete in ${(durationMs / 1000).toFixed(1)}s — ${passedTraces}/${completedTraces.length} traces passed`,
  });

  // ── Persist to MongoDB ──
  try {
    const saved = await EvalRun.create({
      runAt: new Date(),
      summary,
      traces: completedTraces,
      durationMs,
    });

    send(res, {
      type: 'saved',
      runId: saved._id.toString(),
      detail: `Run saved to database (id: ${saved._id})`,
    });
  } catch (err) {
    console.error('Failed to save eval run to DB:', err);
    send(res, {
      type: 'error',
      detail: 'Evaluation completed but failed to save to database.',
    });
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

