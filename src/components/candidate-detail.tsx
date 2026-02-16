"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Candidate, Interview } from "@/db/schema";
import type { EvaluationResult } from "@/types";

interface CandidateDetailProps {
  candidate: Candidate;
  interview: Interview;
}

export function CandidateDetail({
  candidate,
  interview,
}: CandidateDetailProps) {
  let evaluation: EvaluationResult | null = null;
  try {
    if (interview.aiSummary) {
      evaluation = JSON.parse(interview.aiSummary);
    }
  } catch {
    // Invalid JSON, ignore
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-muted-foreground">{candidate.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              interview.status === "completed" ? "default" : "secondary"
            }
          >
            {interview.status}
          </Badge>
          {interview.score != null && (
            <span className="text-2xl font-bold">
              {interview.score}/10
            </span>
          )}
        </div>
      </div>

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>AI Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{evaluation.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-green-700 mb-2">Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-red-700 mb-2">Weaknesses</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>CV Text</CardTitle>
          <CardDescription>{candidate.cvFileName}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
            {candidate.cvText}
          </pre>
        </CardContent>
      </Card>

      {interview.transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              {interview.transcript}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
