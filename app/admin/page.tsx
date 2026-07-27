import AdminHeader from "@/components/admin/admin-header";
import AddClientForm from "@/components/admin/add-client-form";
import ClientList from "@/components/admin/client-list";

export default function AdminHome() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-col gap-8 px-8 py-6">
        <AddClientForm />
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Clients
          </h2>
          <ClientList />
        </div>
      </div>
    </main>
  );
}
