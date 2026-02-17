import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-6 px-4">
          <h1 className="text-lg font-semibold">QScreen Admin</h1>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Candidates
            </Link>
            <Link
              href="/admin/jobs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Jobs
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
