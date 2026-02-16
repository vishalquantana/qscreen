"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import type { Candidate, Interview } from "@/db/schema";

interface CandidateWithInterview extends Candidate {
  interview: Interview | null;
}

interface CandidateTableProps {
  candidates: CandidateWithInterview[];
}

type SortKey = "name" | "email" | "status" | "score" | "date";
type SortDir = "asc" | "desc";

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block ${active ? "opacity-100" : "opacity-0"}`}>
      {dir === "asc" ? "\u2191" : "\u2193"}
    </span>
  );
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(candidates: CandidateWithInterview[]) {
  const headers = ["Name", "Email", "CV File", "Status", "Score", "Date"];
  const rows = candidates.map((c) => [
    c.name,
    c.email,
    c.cvFileName,
    c.interview?.status || "No Interview",
    c.interview?.score != null ? String(c.interview.score) : "",
    c.createdAt,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidates_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...candidates];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "status": {
          const sa = a.interview?.status || "";
          const sb = b.interview?.status || "";
          cmp = sa.localeCompare(sb);
          break;
        }
        case "score": {
          const sa = a.interview?.score ?? -1;
          const sb = b.interview?.score ?? -1;
          cmp = sa - sb;
          break;
        }
        case "date":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [candidates, sortKey, sortDir]);

  const thClass =
    "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(candidates)}
          disabled={candidates.length === 0}
        >
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={thClass} onClick={() => handleSort("name")}>
              Name
              <SortIcon active={sortKey === "name"} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => handleSort("email")}>
              Email
              <SortIcon active={sortKey === "email"} dir={sortDir} />
            </TableHead>
            <TableHead>CV File</TableHead>
            <TableHead className={thClass} onClick={() => handleSort("status")}>
              Status
              <SortIcon active={sortKey === "status"} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => handleSort("score")}>
              Score
              <SortIcon active={sortKey === "score"} dir={sortDir} />
            </TableHead>
            <TableHead className={thClass} onClick={() => handleSort("date")}>
              Date & Time
              <SortIcon active={sortKey === "date"} dir={sortDir} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No candidates yet
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((candidate) => (
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
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDateTime(candidate.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
