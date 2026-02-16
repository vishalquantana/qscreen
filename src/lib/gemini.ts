import { GoogleGenerativeAI } from "@google/generative-ai";
import { evaluationResultSchema, type EvaluationResult } from "@/types";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function generateSystemPrompt(
  cvText: string,
  role?: string
): Promise<string> {
  try {
    const model = getModel();
    const prompt = `You are designing a 10-minute AI voice screening interview. Based on the candidate's CV below, generate a system prompt for an AI interviewer agent.

The system prompt should:
- Greet the candidate warmly
- Ask 4-6 targeted questions based on their CV and experience
- Include follow-up probing questions
- Evaluate technical skills, communication, and culture fit
- Be conversational and natural
- End the interview politely after covering all questions
- Stay within a 10-minute timeframe

${role ? `Target Role: ${role}` : ""}

Candidate CV:
${cvText}

Generate ONLY the system prompt text, no additional commentary.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    throw new Error("Failed to generate system prompt");
  }
}

export async function evaluateCandidate(
  transcript: string,
  cvText: string
): Promise<EvaluationResult> {
  try {
    const model = getModel();
    const prompt = `Evaluate this candidate's screening interview. Analyze their responses for technical competence, communication skills, problem-solving ability, and overall fit.

Candidate CV:
${cvText}

Interview Transcript:
${transcript}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "2-3 sentence overall assessment",
  "score": <number 0-10>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown code blocks if present
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(text);
    return evaluationResultSchema.parse(parsed);
  } catch (error) {
    throw new Error("Failed to evaluate candidate");
  }
}
