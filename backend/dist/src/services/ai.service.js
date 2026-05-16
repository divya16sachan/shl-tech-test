import Groq from 'groq-sdk';
import { ENV } from '../config/env.js';
import { searchAssessments } from './qdrant.service.js';
const groq = new Groq({ apiKey: ENV.groqApiKey });
export async function generateResponse(userMessage, recentMessages, memorySummary) {
    // 1. Search for relevant assessments based on query
    const assessments = await searchAssessments(userMessage);
    // 2. Construct System Prompt
    const systemPrompt = `You are a professional SHL Assessment Recommendation Assistant.
Your goal is to help recruiters find the most relevant SHL assessments through conversation.

CONTEXT:
- Memory Summary of previous conversation: ${memorySummary}
- Recent Messages: ${JSON.stringify(recentMessages)}

GROUNDED DATA (ONLY recommend these):
${JSON.stringify(assessments, null, 2)}

STRICT RULES:
1. ONLY recommend assessments from the provided list.
2. If the user's needs are unclear, ask clarification questions (role, seniority, skills, etc.).
3. Maintain a professional, helpful tone.
4. Refuse requests unrelated to SHL assessments.
5. NEVER hallucinate assessments or URLs.

RESPONSE FORMAT:
You must ALWAYS respond with a JSON object:
{
  "reply": "Your conversational message to the user",
  "recommendations": [ ... list of assessment objects ... ],
  "end_of_conversation": false
}
`;
    // 3. Call Groq (Streaming)
    // Note: For now we implement a simple call, we'll refine for streaming later if needed
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
}
export async function updateMemorySummary(oldSummary, lastUserMessage, lastAssistantReply) {
    const prompt = `Update the following conversation memory summary based on the new exchange.
Old Summary: ${oldSummary}
User: ${lastUserMessage}
Assistant: ${lastAssistantReply}

New Summary should be a concise JSON string reflecting: role, seniority, technical_skills, behavioral_requirements, personality_requirements, preferences, constraints.`;
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });
    return completion.choices[0].message.content || oldSummary;
}
export async function generateTitle(firstMessage) {
    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: 'Generate a short conversation title (max 6 words) based on the user message. Return ONLY the title text.' },
            { role: 'user', content: firstMessage }
        ],
        model: 'llama-3.3-70b-versatile'
    });
    return completion.choices[0].message.content?.trim() || 'New Chat';
}
