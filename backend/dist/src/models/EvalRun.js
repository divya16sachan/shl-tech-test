import mongoose, { Schema } from 'mongoose';
// ─── Schema ───────────────────────────────────────────────────────────────────
const EvalProbesSchema = new Schema({
    clarified: Boolean,
    refused: Boolean,
    refined: Boolean,
    turnCap: Boolean,
}, { _id: false });
const EvalTraceSchema = new Schema({
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
}, { _id: false });
const EvalSummarySchema = new Schema({
    meanRecall: Number,
    groundedness: Number,
    probePassRate: Number,
    avgTurns: Number,
    totalTraces: Number,
    passedTraces: Number,
}, { _id: false });
const EvalRunSchema = new Schema({
    runAt: { type: Date, default: Date.now },
    summary: EvalSummarySchema,
    traces: [EvalTraceSchema],
    durationMs: Number,
}, { timestamps: false });
export const EvalRun = mongoose.model('EvalRun', EvalRunSchema);
