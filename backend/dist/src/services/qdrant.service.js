import { qdrant_client } from '../config/qdrant.js';
import { pipeline } from '@xenova/transformers';
import Groq from 'groq-sdk';
import { ENV } from '../config/env.js';
import { readFileSync } from 'fs';
import fuzzysort from 'fuzzysort';
const COLLECTION_NAME = 'shl_assessments';
let embedder = null;
const groq = new Groq({ apiKey: ENV.groqApiKey });
let catalogCache = [];
function getCatalog() {
    if (catalogCache.length === 0) {
        try {
            const raw = readFileSync('./src/seed/data.min.json', 'utf-8');
            catalogCache = JSON.parse(raw).assessments;
        }
        catch (e) {
            console.error('Failed to load catalog for fallback', e);
        }
    }
    return catalogCache;
}
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/bge-large-en-v1.5');
    }
    return embedder;
}
async function expandQuery(query) {
    try {
        const resp = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: `You are an expert SHL Assessment search query expander.
Given a hiring query, extract key skills and predict the most relevant SHL assessment names.
Mapping rules:
- problem solving, complex systems, reasoning, cognitive ability, distributed systems -> include "Verify - G+"
- personality, collaboration, teamwork, leadership, stakeholders -> include "Occupational Personality Questionnaire OPQ32r"
- motivation, drive, energy, sales -> include "Motivation Questionnaire MQM5"
- remote work, WFH -> include "RemoteWorkQ"
- graduates, volume hiring, general competencies -> include "Global Skills Assessment"
- specific tech skills -> include the exact skill name (e.g., "Java 8", "Python").
Output ONLY a comma-separated list of the predicted assessment names and keywords. No explanation.` },
                { role: 'user', content: query }
            ],
            temperature: 0.1,
            max_tokens: 100,
        });
        return resp.choices[0]?.message?.content?.trim() || '';
    }
    catch (e) {
        console.error('Error expanding query:', e);
        return '';
    }
}
export async function searchAssessments(query, limit = 5) {
    try {
        const extractor = await getEmbedder();
        const expandedKeywords = await expandQuery(query);
        const [origOutput, expandedOutput] = await Promise.all([
            extractor(query, { pooling: 'mean', normalize: true }),
            expandedKeywords ? extractor(expandedKeywords, { pooling: 'mean', normalize: true }) : null
        ]);
        let vector;
        if (expandedOutput) {
            const origVec = Array.from(origOutput.data);
            const expVec = Array.from(expandedOutput.data);
            vector = origVec.map((val, i) => (val + expVec[i]) / 2.0);
            // Normalize the resulting vector
            const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
            vector = vector.map(v => v / mag);
        }
        else {
            vector = Array.from(origOutput.data);
        }
        const results = await qdrant_client.search(COLLECTION_NAME, {
            vector: vector,
            limit: limit * 3, // get more candidates for deduplication
            with_payload: true,
        });
        const qdrantAssessments = results.map((res) => ({
            name: res.payload.name,
            url: res.payload.url,
            remote_testing: res.payload.remote_testing,
            adaptive_irt: res.payload.adaptive_irt,
            test_types: res.payload.test_types,
            test_type_codes: res.payload.test_type_codes,
            description: res.payload.description,
            _score: res.score,
        }));
        // In-memory Keyword Fallback using fuzzysort
        const catalog = getCatalog();
        const keywordMatches = [];
        const termsToSearch = Array.from(new Set([
            query,
            expandedKeywords,
            ...expandedKeywords.split(/[\s,]+/).filter(t => t.length > 3)
        ]));
        for (const term of termsToSearch) {
            const fuzzyResults = fuzzysort.go(term, catalog, {
                key: 'name',
                limit: 3
            });
            for (const res of fuzzyResults) {
                if (res.score > -2000) { // filter out completely unrelated garbage
                    keywordMatches.push({
                        name: res.obj.name,
                        url: res.obj.url,
                        remote_testing: res.obj.remote_testing,
                        adaptive_irt: res.obj.adaptive_irt,
                        test_types: res.obj.test_types,
                        test_type_codes: res.obj.test_type_codes,
                        description: res.obj.description || "",
                        _score: 10.0 + (res.score / 1000)
                    });
                }
            }
        }
        // Merge and Deduplicate
        const combined = [...keywordMatches, ...qdrantAssessments];
        const unique = new Map();
        for (const item of combined) {
            if (!unique.has(item.name) || item._score > unique.get(item.name)._score) {
                unique.set(item.name, item);
            }
        }
        const finalResults = Array.from(unique.values())
            .sort((a, b) => b._score - a._score)
            .slice(0, limit);
        return finalResults.map(({ _score, ...rest }) => rest);
    }
    catch (error) {
        console.error('Error searching assessments:', error);
        return [];
    }
}
