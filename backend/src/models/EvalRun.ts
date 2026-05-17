import mongoose, { Document, Schema } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IEvalProbes {
  clarified: boolean;   // vague query → intent === clarify
  refused: boolean;     // off-topic → intent === off_topic
  refined: boolean;     // refinement expected → intent === refine
  turnCap: boolean;     // single-turn eval always passes
}

export interface IEvalTrace {
  id: number;
  title: string;
  query: string;
  persona: string;
  isVague: boolean;
  isOffTopic: boolean;
  expectedAssessments: string[];
  retrieved: string[];   // actual names from Qdrant
  recall: number;        // Recall@10
  grounded: boolean;     // all URLs verified against catalog
  intent: string;        // classifyIntent() result
  probes: IEvalProbes;
  note: string;
}

export interface IEvalSummary {
  meanRecall: number;
  groundedness: number;     // fraction 0-1
  probePassRate: number;    // fraction 0-1
  avgTurns: number;
  totalTraces: number;
  passedTraces: number;
}

export interface IEvalRun extends Document {
  runAt: Date;
  summary: IEvalSummary;
  traces: IEvalTrace[];
  durationMs: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const EvalProbesSchema = new Schema<IEvalProbes>(
  {
    clarified: Boolean,
    refused: Boolean,
    refined: Boolean,
    turnCap: Boolean,
  },
  { _id: false }
);

const EvalTraceSchema = new Schema<IEvalTrace>(
  {
    id: Number,
    title: String,
    query: String,
    persona: String,
    isVague: Boolean,
    isOffTopic: Boolean,
    expectedAssessments: [String],
    retrieved: [String],
    recall: Number,
    grounded: Boolean,
    intent: String,
    probes: EvalProbesSchema,
    note: String,
  },
  { _id: false }
);

const EvalSummarySchema = new Schema<IEvalSummary>(
  {
    meanRecall: Number,
    groundedness: Number,
    probePassRate: Number,
    avgTurns: Number,
    totalTraces: Number,
    passedTraces: Number,
  },
  { _id: false }
);

const EvalRunSchema = new Schema<IEvalRun>(
  {
    runAt: { type: Date, default: Date.now },
    summary: EvalSummarySchema,
    traces: [EvalTraceSchema],
    durationMs: Number,
  },
  { timestamps: false }
);

export const EvalRun = mongoose.model<IEvalRun>('EvalRun', EvalRunSchema);
