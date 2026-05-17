import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { TRACE_DEFINITIONS, recallAtK, isGrounded, buildNote, classifyIntent } from '../services/eval.service.js';
import { searchAssessments } from '../services/qdrant.service.js';
async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ENV.mongoUri);
    console.log('Running evaluation traces...\n');
    const completedTraces = [];
    for (const def of TRACE_DEFINITIONS) {
        console.log(`[${def.id}/${TRACE_DEFINITIONS.length}] ${def.title}`);
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
        console.log(`   Recall: ${recall.toFixed(2)}, Intent: ${intent === def.expectedIntent ? 'PASS' : 'FAIL'} (${intent})`);
    }
    const nonVague = completedTraces.filter((t) => !t.isVague && !t.isOffTopic);
    const meanRecall = nonVague.length > 0
        ? nonVague.reduce((s, t) => s + t.recall, 0) / nonVague.length : 1.0;
    const groundedness = completedTraces.filter((t) => t.grounded).length / completedTraces.length;
    const totalProbes = completedTraces.length * 4;
    const passedProbes = completedTraces.reduce((s, t) => s + Object.values(t.probes).filter(Boolean).length, 0);
    const passedTraces = completedTraces.filter((t) => {
        if (t.isVague || t.isOffTopic)
            return Object.values(t.probes).every(Boolean);
        return t.recall >= 0.8;
    }).length;
    console.log('\n========================================');
    console.log('           EVALUATION SUMMARY');
    console.log('========================================');
    console.log(`Total Traces:      ${completedTraces.length}`);
    console.log(`Passed Traces:     ${passedTraces} / ${completedTraces.length}`);
    console.log(`Mean Recall@10:    ${meanRecall.toFixed(3)}`);
    console.log(`Groundedness:      ${groundedness.toFixed(3)}`);
    console.log(`Probe Pass Rate:   ${(passedProbes / totalProbes).toFixed(3)}`);
    console.log('========================================\n');
    await mongoose.disconnect();
    process.exit(0);
}
main().catch(err => {
    console.error('Eval failed:', err);
    process.exit(1);
});
