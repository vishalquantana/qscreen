import { GoogleGenerativeAI } from "@google/generative-ai";
import { evaluationResultSchema, type EvaluationResult } from "@/types";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

interface JobContext {
  title: string;
  description: string;
  criteria: string;
}

export async function generateSystemPrompt(
  cvText: string,
  job?: JobContext
): Promise<string> {
  try {
    const model = getModel();

    const jobSection = job
      ? `Target Role: ${job.title}
Job Description: ${job.description}
Evaluation Criteria: ${job.criteria}`
      : "";

    const prompt = `You are designing a 10-minute AI voice screening interview. Based on the candidate's CV below, generate a system prompt for an AI interviewer agent.

The system prompt should:
- Greet the candidate briefly (one sentence max)
- Ask 4-6 targeted questions based on their CV and experience
- Include follow-up probing questions
- Evaluate technical skills, communication, and culture fit
- Be conversational but CONCISE — keep responses SHORT (1-2 sentences max)
- NEVER repeat or paraphrase what the candidate just said
- NEVER say things like "That's great", "Interesting", "Thank you for sharing that"
- Just ask the next question directly after the candidate finishes speaking
- Transition between questions naturally but briefly
- End the interview politely after covering all questions
- Stay within a 10-minute timeframe

CRITICAL STYLE RULES for the interviewer:
- Say LESS, ask MORE
- No filler acknowledgments or validation
- No summarizing the candidate's answer back to them
- Move quickly between questions
- Short, direct transitions like "Got it." or "Next question:" are fine
- Maximum 2 sentences per interviewer turn

${jobSection}

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
  cvText: string,
  job?: JobContext
): Promise<EvaluationResult> {
  try {
    const model = getModel();

    const jobSection = job
      ? `\nTarget Role: ${job.title}
Job Description: ${job.description}
Evaluation Criteria: ${job.criteria}

Evaluate the candidate specifically against the above criteria.\n`
      : "";

    const prompt = `Evaluate this candidate's screening interview. Analyze their responses for technical competence, communication skills, problem-solving ability, and overall fit.
${jobSection}
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
