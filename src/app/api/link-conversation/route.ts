import { NextResponse } from "next/server";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { linkConversationSchema } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = linkConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { candidateId, conversationId } = validation.data;

    await db
      .update(interviews)
      .set({ elevenlabsConversationId: conversationId })
      .where(eq(interviews.candidateId, candidateId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link conversation error:", error);
    return NextResponse.json(
      { error: "Failed to link conversation" },
      { status: 500 }
    );
  }
}
