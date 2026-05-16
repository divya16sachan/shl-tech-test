import { qdrant_client } from '../config/qdrant.js';
import { pipeline } from '@xenova/transformers';
const COLLECTION_NAME = 'shl_assessments';
let embedder = null;
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/bge-large-en-v1.5');
    }
    return embedder;
}
export async function searchAssessments(query, limit = 5) {
    try {
        const extractor = await getEmbedder();
        const output = await extractor(query, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);
        const results = await qdrant_client.search(COLLECTION_NAME, {
            vector: vector,
            limit: limit,
            with_payload: true,
        });
        return results.map((res) => ({
            name: res.payload.name,
            url: res.payload.url,
            remote_testing: res.payload.remote_testing,
            adaptive_irt: res.payload.adaptive_irt,
            test_types: res.payload.test_types,
            test_type_codes: res.payload.test_type_codes,
            description: res.payload.description,
        }));
    }
    catch (error) {
        console.error('Error searching assessments:', error);
        return [];
    }
}
