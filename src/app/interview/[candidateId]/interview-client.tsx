"use client";

import { useState, useEffect } from "react";
import { VoiceInterview } from "@/components/voice-interview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InterviewClientProps {
  candidateId: number;
  systemPrompt: string;
}

export function InterviewClient({
  candidateId,
  systemPrompt: initialPrompt,
}: InterviewClientProps) {
  const [systemPrompt, setSystemPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ready, setReady] = useState(!!initialPrompt);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPrompt) {
      generatePrompt();
    }
  }, [initialPrompt]);

  async function generatePrompt() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSystemPrompt(data.systemPrompt);
      setReady(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to prepare interview"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (isGenerating) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Preparing Your Interview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <p className="text-muted-foreground animate-pulse">
            Analyzing your CV and generating interview questions...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={generatePrompt}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!ready) return null;

  return (
    <VoiceInterview candidateId={candidateId} systemPrompt={systemPrompt} />
  );
}
