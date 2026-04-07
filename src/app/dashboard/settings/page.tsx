import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OfficeSettings } from "@/components/admin/settings/OfficeSettings";
import { PractitionersSettings } from "@/components/admin/settings/PractitionersSettings";
import { SlotTypesSettings } from "@/components/admin/settings/SlotTypesSettings";
import { CustomFieldsSettings } from "@/components/admin/settings/CustomFieldsSettings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) redirect("/login");

  const [
    { data: office },
    { data: practitioners },
    { data: slotTypes },
    { data: customFields },
  ] = await Promise.all([
    supabase.from("offices").select("*").eq("id", admin.office_id).single(),
    supabase
      .from("practitioners")
      .select("*")
      .eq("office_id", admin.office_id)
      .order("created_at"),
    supabase
      .from("slot_types")
      .select("*")
      .eq("office_id", admin.office_id)
      .order("created_at"),
    supabase
      .from("custom_fields")
      .select("*")
      .eq("office_id", admin.office_id)
      .order("sort_order"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your office, team, and booking configuration.
        </p>
      </div>

      <Tabs defaultValue="office">
        <TabsList className="mb-6">
          <TabsTrigger value="office">Office</TabsTrigger>
          <TabsTrigger value="practitioners">Practitioners</TabsTrigger>
          <TabsTrigger value="slot-types">Slot Types</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="office">
          <OfficeSettings office={office!} />
        </TabsContent>

        <TabsContent value="practitioners">
          <PractitionersSettings practitioners={practitioners ?? []} />
        </TabsContent>

        <TabsContent value="slot-types">
          <SlotTypesSettings slotTypes={slotTypes ?? []} />
        </TabsContent>

        <TabsContent value="custom-fields">
          <CustomFieldsSettings customFields={customFields ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
