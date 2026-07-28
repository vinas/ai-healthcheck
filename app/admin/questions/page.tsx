import AdminHeader from "@/components/admin/admin-header";
import QuestionsManager from "@/components/admin/questions-manager";

export default function QuestionsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-col gap-8 px-8 py-6">
        <QuestionsManager />
      </div>
    </main>
  );
}
