import { searchAssessments } from './src/services/qdrant.service.js';
async function test() {
    const query = 'I am hiring a senior Java backend developer with 6+ years experience who will work on distributed systems and collaborate with cross-functional stakeholders.';
    const res = await searchAssessments(query);
    console.log(res.map(a => a.name));
}
test().catch(console.error);
