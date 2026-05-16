import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optional(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const ENV = {
    mongoUri: required('MONGO_URI'),
    qdrantUrl: required('QDRANT_URL'),
    qdrantApiKey: required('QDRANT_API_KEY'),
    groqApiKey: required('GROQ_API_KEY'),
    port: optional('PORT', '5000')
}
