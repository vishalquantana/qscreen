import { createJob } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/jobs"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to Jobs
      </Link>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>
            Add a new job posting for candidates to apply to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createJob} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. GTM Manager"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the role, responsibilities, and requirements..."
                required
                rows={6}
                maxLength={5000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Evaluation Criteria</Label>
              <Textarea
                id="criteria"
                name="criteria"
                placeholder="What should the AI evaluate candidates on? e.g. technical skills, leadership, communication..."
                required
                rows={4}
                maxLength={5000}
              />
            </div>
            <Button type="submit">Create Job</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
