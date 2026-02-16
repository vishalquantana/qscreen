import { CvUploadForm } from "@/components/cv-upload-form";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Skylark GTM Manager</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          AI-Powered Voice Screening Interviews
        </p>
      </div>
      <CvUploadForm />
    </main>
  );
}
