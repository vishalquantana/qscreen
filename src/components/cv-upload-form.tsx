"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UploadPhase = "idle" | "uploading" | "processing" | "ready";

function ProgressBar({ progress, phase }: { progress: number; phase: UploadPhase }) {
  if (phase === "idle") return null;

  const label =
    phase === "uploading"
      ? "Uploading CV..."
      : phase === "processing"
        ? "Processing your CV..."
        : "Ready! Click Start when you're ready.";

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function CvUploadForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<{ candidateId: number; accessToken: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhase("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      // Use XMLHttpRequest for upload progress tracking
      const result = await new Promise<{ candidateId: number; accessToken: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              // Upload is 0-60% of the progress bar
              const pct = (event.loaded / event.total) * 60;
              setProgress(pct);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch {
                reject(new Error("Invalid server response"));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText);
                reject(new Error(data.error || "Upload failed"));
              } catch {
                reject(new Error("Upload failed"));
              }
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("POST", "/api/upload-cv");
          xhr.send(formData);
        }
      );

      // Upload complete — now simulate processing phase (60% -> 100%)
      setPhase("processing");
      setProgress(60);

      await new Promise<void>((resolve) => {
        let p = 60;
        const interval = setInterval(() => {
          p += 2;
          setProgress(Math.min(p, 100));
          if (p >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 50); // 2% every 50ms = ~2 seconds total
      });

      resultRef.current = result;
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
      setProgress(0);
    }
  }

  function handleStart() {
    if (resultRef.current) {
      router.push(
        `/interview/${resultRef.current.candidateId}?token=${resultRef.current.accessToken}`
      );
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Start Your Interview</CardTitle>
        <CardDescription>
          Upload your CV to begin the AI screening interview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
              disabled={phase !== "idle"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              disabled={phase !== "idle"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv">CV (PDF only)</Label>
            <Input
              id="cv"
              name="cv"
              type="file"
              accept=".pdf,application/pdf"
              required
              disabled={phase !== "idle"}
            />
          </div>

          <ProgressBar progress={progress} phase={phase} />

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {phase === "ready" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                <span>You&apos;ll need to <strong>allow microphone access</strong> when prompted.</span>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={handleStart}
              >
                Start Interview
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full"
              disabled={phase !== "idle"}
            >
              {phase === "idle"
                ? "Upload & Start Interview"
                : phase === "uploading"
                  ? "Uploading..."
                  : "Processing..."}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
