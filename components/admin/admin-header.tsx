import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COOKIE_NAME } from "@/lib/auth";

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}

export default function AdminHeader() {
  return (
    <header className="border-b border-border px-8 py-4">
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
    </header>
  );
}
