import AdminHeader from "@/components/admin/admin-header";

export default function AdminHome() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">No content yet.</p>
      </div>
    </main>
  );
}
