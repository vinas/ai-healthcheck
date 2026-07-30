"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "./logout-action";

const NAV_LINKS = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/questions", label: "Questions" },
];

export default function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border px-8 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            AI-Healthcheck — Admin
          </h1>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        <nav className="flex items-center gap-2">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" })}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
