import { Button } from "@/components/ui/button";

export default function AdminHome() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            AI-Healthcheck — Admin
          </h1>
          <Button variant="outline" size="sm">
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">No content yet.</p>
      </div>
    </main>
  );
}
