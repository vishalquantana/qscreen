import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your interview has been completed and recorded. Our team will
            review your responses and get back to you soon.
          </p>
          <p className="text-sm text-muted-foreground">
            You may close this window now.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
