export interface TranscriptEntry {
  role: "agent" | "user";
  message: string;
}

export interface ParsedWebhookPayload {
  conversationId: string;
  transcript: TranscriptEntry[];
  status: string;
}

export function parseWebhookPayload(payload: unknown): ParsedWebhookPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid webhook payload: not an object");
  }

  const p = payload as Record<string, unknown>;

  if (p.type !== "post_conversation_evaluation") {
    throw new Error(`Invalid webhook type: ${p.type}`);
  }

  const data = p.data as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid webhook payload: missing data");
  }

  const conversationId = data.conversation_id;
  if (typeof conversationId !== "string") {
    throw new Error("Invalid webhook payload: missing conversation_id");
  }

  const transcript = data.transcript;
  if (!Array.isArray(transcript)) {
    throw new Error("Invalid webhook payload: missing transcript");
  }

  return {
    conversationId,
    transcript: transcript.map((entry: { role: string; message: string }) => ({
      role: entry.role as "agent" | "user",
      message: entry.message,
    })),
    status: (data.status as string) || "done",
  };
}

export function formatTranscript(transcript: TranscriptEntry[]): string {
  if (transcript.length === 0) return "";

  return transcript
    .map((entry) => {
      const speaker = entry.role === "agent" ? "Agent" : "Candidate";
      return `${speaker}: ${entry.message}`;
    })
    .join("\n\n");
}
