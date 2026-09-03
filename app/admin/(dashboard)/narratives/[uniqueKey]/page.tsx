import AdminHeader from "@/components/admin/admin-header";
import NarrativeEditor from "@/components/admin/narrative-editor";

export default async function NarrativePage({
  params,
}: {
  params: Promise<{ uniqueKey: string }>;
}) {
  const { uniqueKey } = await params;
  return (
    <>
      <AdminHeader />
      <NarrativeEditor uniqueKey={uniqueKey} />
    </>
  );
}
