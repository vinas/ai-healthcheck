"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "./logout-action";

const NAV_LINKS = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/questions", label: "Questions" },
];

export default function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-10">
          <h1 className="text-lg font-semibold text-foreground">
            AI-Healthcheck — Admin
          </h1>
          <nav className="flex items-center gap-4">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    isActive
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
