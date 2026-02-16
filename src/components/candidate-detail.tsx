"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Candidate, Interview } from "@/db/schema";
import type { EvaluationResult } from "@/types";

interface CandidateDetailProps {
  candidate: Candidate;
  interview: Interview;
  cvPresignedUrl?: string | null;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color =
    score >= 7 ? "text-green-500" : score >= 4 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className="absolute text-2xl font-bold">{score}</span>
    </div>
  );
}

function TranscriptMessage({
  role,
  message,
}: {
  role: string;
  message: string;
}) {
  const isAgent = role === "Interviewer";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isAgent
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <p className="font-medium text-xs mb-1 opacity-70">
          {isAgent ? "Sarah (Interviewer)" : "Candidate"}
        </p>
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function CandidateDetail({
  candidate,
  interview,
  cvPresignedUrl,
}: CandidateDetailProps) {
  let evaluation: EvaluationResult | null = null;
  try {
    if (interview.aiSummary) {
      evaluation = JSON.parse(interview.aiSummary);
    }
  } catch {
    // Invalid JSON, ignore
  }

  // Parse transcript into structured messages
  const transcriptMessages: { role: string; message: string }[] = [];
  if (interview.transcript) {
    const lines = interview.transcript.split("\n\n");
    for (const line of lines) {
      const match = line.match(/^(Interviewer|Candidate|Agent):\s*([\s\S]+)/);
      if (match) {
        transcriptMessages.push({
          role: match[1] === "Agent" ? "Interviewer" : match[1],
          message: match[2].trim(),
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-muted-foreground">{candidate.email}</p>
        </div>
        <Badge
          variant={
            interview.status === "completed" ? "default" : "secondary"
          }
        >
          {interview.status}
        </Badge>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-4 items-start">
        {/* Left: CV Preview */}
        <Card className="h-[calc(100vh-180px)] flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">CV - {candidate.cvFileName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            {cvPresignedUrl ? (
              <iframe
                src={cvPresignedUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Candidate CV"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-xs p-4 overflow-y-auto h-full">
                {candidate.cvText}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Middle: Transcript */}
        <Card className="h-[calc(100vh-180px)] flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Interview Transcript</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
            {transcriptMessages.length > 0 ? (
              <div className="space-y-3">
                {transcriptMessages.map((msg, i) => (
                  <TranscriptMessage
                    key={i}
                    role={msg.role}
                    message={msg.message}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No transcript available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right: Score & Evaluation */}
        <div className="space-y-4">
          {interview.score != null && (
            <Card>
              <CardContent className="flex flex-col items-center py-6">
                <ScoreRing score={interview.score} />
                <p className="text-sm text-muted-foreground mt-2">
                  Overall Score
                </p>
              </CardContent>
            </Card>
          )}

          {evaluation && (
            <>
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm">AI Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm leading-relaxed">
                    {evaluation.summary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm text-green-600">
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-1.5">
                    {evaluation.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-0.5">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm text-red-600">
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-1.5">
                    {evaluation.weaknesses.map((w, i) => (
                      <li
                        key={i}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="text-red-500 mt-0.5">-</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {!evaluation && !interview.score && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Evaluation pending
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
