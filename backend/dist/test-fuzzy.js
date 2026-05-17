import fuzzysort from 'fuzzysort';
import { readFileSync } from 'fs';
const raw = readFileSync('./src/seed/data.min.json', 'utf-8');
const catalog = JSON.parse(raw).assessments;
const terms = ['Java', 'OPQ32r', 'Motivation', 'Python', 'Verify'];
for (const term of terms) {
    console.log(`\nResults for ${term}:`);
    const results = fuzzysort.go(term, catalog, { key: 'name', limit: 3 });
    results.forEach(r => console.log(`${r.score}: ${r.obj.name}`));
}
