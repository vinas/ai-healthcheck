import AdminHeader from "@/components/admin/admin-header";
import NarrativeEditor from "@/components/admin/narrative-editor";

export default async function NarrativePage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <NarrativeEditor uniqueKey={uniqueKey} />
    </main>
  );
}
