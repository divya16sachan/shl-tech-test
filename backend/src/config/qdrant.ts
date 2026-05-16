import { QdrantClient } from '@qdrant/js-client-rest';
import { ENV } from './env.js';

export const qdrant_client = new QdrantClient({
    url: ENV.qdrantUrl,
    apiKey: ENV.qdrantApiKey,
});