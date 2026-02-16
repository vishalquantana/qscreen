"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Candidate, Interview } from "@/db/schema";

interface CandidateWithInterview extends Candidate {
  interview: Interview | null;
}

interface CandidateTableProps {
  candidates: CandidateWithInterview[];
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="secondary">No Interview</Badge>;

  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "secondary",
    in_progress: "outline",
    completed: "default",
    evaluation_failed: "destructive",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    evaluation_failed: "Eval Failed",
  };

  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  );
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>CV File</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No candidates yet
            </TableCell>
          </TableRow>
        ) : (
          candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell>
                <Link
                  href={`/admin/${candidate.id}`}
                  className="font-medium hover:underline"
                >
                  {candidate.name}
                </Link>
              </TableCell>
              <TableCell>{candidate.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {candidate.cvFileName}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={candidate.interview?.status || null}
                />
              </TableCell>
              <TableCell>
                {candidate.interview?.score != null
                  ? `${candidate.interview.score}/10`
                  : "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(candidate.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
