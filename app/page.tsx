import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          AI-Healthcheck
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage your AI systems.
        </p>
        <Link href="/admin" className={buttonVariants()}>
          Go to Admin
        </Link>
      </div>
    </main>
  );
}
