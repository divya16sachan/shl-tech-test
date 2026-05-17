import { EvalRun } from '../models/EvalRun.js';
import { runEvaluation } from '../services/eval.service.js';
// ─── POST /eval/run ───────────────────────────────────────────────────────────
// Runs evaluation, saves to DB, returns full run.
export async function runEval(req, res) {
    try {
        const result = await runEvaluation();
        const saved = await EvalRun.create({
            runAt: new Date(),
            summary: result.summary,
            traces: result.traces,
            durationMs: result.durationMs,
        });
        res.json(saved);
    }
    catch (error) {
        console.error('Eval run error:', error);
        res.status(500).json({ error: 'Evaluation failed. Check server logs.' });
    }
}
// ─── GET /eval/runs ───────────────────────────────────────────────────────────
// Returns list of past runs (summary only, no trace detail) newest-first.
export async function listEvalRuns(req, res) {
    try {
        const runs = await EvalRun.find({}, { summary: 1, runAt: 1, durationMs: 1 } // projection — no traces array
        )
            .sort({ runAt: -1 })
            .limit(20);
        res.json(runs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list evaluation runs' });
    }
}
// ─── GET /eval/runs/latest ────────────────────────────────────────────────────
// Convenience shortcut — returns the most recent full run.
export async function getLatestEvalRun(req, res) {
    try {
        const run = await EvalRun.findOne().sort({ runAt: -1 });
        if (!run)
            return res.status(404).json({ error: 'No evaluation runs found' });
        res.json(run);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest evaluation run' });
    }
}
// ─── GET /eval/runs/:id ───────────────────────────────────────────────────────
// Returns a specific run with full trace detail.
export async function getEvalRun(req, res) {
    try {
        const run = await EvalRun.findById(req.params.id);
        if (!run)
            return res.status(404).json({ error: 'Evaluation run not found' });
        res.json(run);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch evaluation run' });
    }
}
