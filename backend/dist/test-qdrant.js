import { searchAssessments } from './src/services/qdrant.service.js';
async function test() {
    console.log('Testing Java 8...');
    const res1 = await searchAssessments('Java 8');
    console.log(res1.slice(0, 3).map(a => a.name));
    console.log('\nTesting OPQ32r...');
    const res2 = await searchAssessments('OPQ32r');
    console.log(res2.slice(0, 3).map(a => a.name));
}
test().catch(console.error);
