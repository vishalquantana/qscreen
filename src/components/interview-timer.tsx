"use client";

import { useState, useEffect, useCallback } from "react";

interface InterviewTimerProps {
  durationMinutes?: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

export function InterviewTimer({
  durationMinutes = 10,
  onTimeUp,
  isRunning,
}: InterviewTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  const handleTimeUp = useCallback(onTimeUp, [onTimeUp]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft <= 60;

  return (
    <div
      className={`text-2xl font-mono font-bold tabular-nums ${
        isWarning ? "text-destructive animate-pulse" : "text-foreground"
      }`}
      role="timer"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
