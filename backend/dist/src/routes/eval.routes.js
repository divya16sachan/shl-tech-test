import { Router } from 'express';
import { runEval, listEvalRuns, getLatestEvalRun, getEvalRun, } from '../controllers/eval.controller.js';
const router = Router();
router.post('/run', runEval); // POST /eval/run      — run & save
router.get('/runs', listEvalRuns); // GET  /eval/runs     — list summaries
router.get('/runs/latest', getLatestEvalRun); // GET /eval/runs/latest
router.get('/runs/:id', getEvalRun); // GET  /eval/runs/:id — full run
export default router;
