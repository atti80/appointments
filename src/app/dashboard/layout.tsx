import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("id, name, email, office:offices(id, name, logo_url, brand_color)")
    .single();

  if (!admin) redirect("/login");

  const office = Array.isArray(admin.office) ? admin.office[0] : admin.office;

  return (
    <div className="flex h-screen bg-muted/40 overflow-hidden">
      <Sidebar admin={admin} office={office} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
