"use client";

import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewTimer } from "./interview-timer";

interface VoiceInterviewProps {
  candidateId: number;
  systemPrompt: string;
}

export function VoiceInterview({
  candidateId,
  systemPrompt,
}: VoiceInterviewProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "active" | "ended"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setStatus("active");
    },
    onDisconnect: () => {
      setStatus("ended");
    },
    onError: (err) => {
      console.error("ElevenLabs error:", err);
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as Error).message
          : "Voice connection error. Please try again.";
      setError(message);
      setStatus("idle");
    },
  });

  const startInterview = useCallback(async () => {
    try {
      setStatus("connecting");
      setError(null);

      // Link the conversation before starting
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        throw new Error("ElevenLabs agent ID not configured");
      }

      const conversationId = await conversation.startSession({
        agentId,
        connectionType: "websocket",
        overrides: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
          },
        },
      });

      // Link conversation ID to candidate
      await fetch("/api/link-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, conversationId }),
      });
    } catch (err) {
      console.error("Start interview error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start interview"
      );
      setStatus("idle");
    }
  }, [candidateId, systemPrompt, conversation]);

  const endInterview = useCallback(async () => {
    try {
      await conversation.endSession();
      setStatus("ended");

      // Fetch transcript from ElevenLabs and run AI evaluation
      await fetch("/api/complete-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      setTimeout(() => {
        window.location.href = "/thank-you";
      }, 2000);
    } catch {
      setStatus("ended");
    }
  }, [conversation, candidateId]);

  const handleTimeUp = useCallback(() => {
    endInterview();
  }, [endInterview]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle>Voice Interview</CardTitle>
        {status === "active" && (
          <InterviewTimer onTimeUp={handleTimeUp} isRunning={true} />
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {status === "idle" && (
          <>
            <p className="text-muted-foreground text-center">
              This is a 10-minute voice interview with our AI interviewer.
              Please ensure you&apos;re in a quiet environment.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              <span>Your browser will ask for <strong>microphone access</strong> — please allow it.</span>
            </div>
            <Button size="lg" onClick={startInterview}>
              Start Interview
            </Button>
          </>
        )}

        {status === "connecting" && (
          <p className="text-muted-foreground animate-pulse">
            Connecting to interviewer...
          </p>
        )}

        {status === "active" && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {conversation.isSpeaking
                  ? "AI is speaking..."
                  : "Listening..."}
              </span>
            </div>
            <Button variant="destructive" onClick={endInterview}>
              End Interview
            </Button>
          </>
        )}

        {status === "ended" && (
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Interview Complete</p>
            <p className="text-muted-foreground">
              Thank you! Redirecting...
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
