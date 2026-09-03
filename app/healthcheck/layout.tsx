import type { ReactNode } from "react";

export default function HealthcheckLayout({ children }: { children: ReactNode }) {
  return <main className="flex min-h-screen flex-col bg-background">{children}</main>;
}
