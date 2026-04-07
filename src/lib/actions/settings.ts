"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Office ────────────────────────────────────────────────────────────────

export async function updateOfficeAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("offices")
    .update({
      name: formData.get("name")?.toString().trim(),
      slug: formData.get("slug")?.toString().trim(),
      welcome_message:
        formData.get("welcome_message")?.toString().trim() || null,
      brand_color: formData.get("brand_color")?.toString() ?? "#6470f3",
      cancellation_cutoff_minutes: parseInt(
        formData.get("cancellation_cutoff_minutes")?.toString() ?? "1440"
      ),
      reminder_minutes_before: parseInt(
        formData.get("reminder_minutes_before")?.toString() ?? "1440"
      ),
      booking_timeout_minutes: parseInt(
        formData.get("booking_timeout_minutes")?.toString() ?? "10"
      ),
      default_slot_minutes: parseInt(
        formData.get("default_slot_minutes")?.toString() ?? "30"
      ),
    })
    .eq("id", admin.office_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function uploadLogoAction(
  formData: FormData
): Promise<ActionResult<{ logo_url: string }>> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const file = formData.get("logo") as File;
  if (!file || file.size === 0)
    return { success: false, error: "No file provided" };

  if (file.size > 2 * 1024 * 1024)
    return { success: false, error: "Logo must be under 2MB" };
  if (
    !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
      file.type
    )
  ) {
    return { success: false, error: "Logo must be a PNG, JPEG, WebP or SVG" };
  }

  const ext = file.name.split(".").pop();
  const path = `${admin.office_id}/logo.${ext}`;
  const arrayBuf = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("office-logos")
    .upload(path, arrayBuf, { contentType: file.type, upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("office-logos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("offices")
    .update({ logo_url: publicUrl })
    .eq("id", admin.office_id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { logo_url: publicUrl } };
}

// ─── Practitioners ─────────────────────────────────────────────────────────

export async function upsertPractitionerAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const id = formData.get("id")?.toString() || null;
  const data = {
    office_id: admin.office_id,
    name: formData.get("name")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim() || null,
    bio: formData.get("bio")?.toString().trim() || null,
    is_active: true,
  };

  if (!data.name) return { success: false, error: "Name is required" };

  const { error } = id
    ? await supabase.from("practitioners").update(data).eq("id", id)
    : await supabase.from("practitioners").insert(data);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function togglePractitionerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("practitioners")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Slot types ────────────────────────────────────────────────────────────

export async function upsertSlotTypeAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const id = formData.get("id")?.toString() || null;
  const name = formData.get("name")?.toString().trim() ?? "";
  const duration = parseInt(
    formData.get("duration_minutes")?.toString() ?? "0"
  );

  if (!name) return { success: false, error: "Name is required" };
  if (duration < 1)
    return { success: false, error: "Duration must be at least 1 minute" };

  const data = {
    office_id: admin.office_id,
    name,
    duration_minutes: duration,
    is_active: true,
  };

  const { error } = id
    ? await supabase.from("slot_types").update(data).eq("id", id)
    : await supabase.from("slot_types").insert(data);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleSlotTypeAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("slot_types")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Custom fields ─────────────────────────────────────────────────────────

export async function upsertCustomFieldAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const id = formData.get("id")?.toString() || null;
  const label = formData.get("label")?.toString().trim() ?? "";
  const field_type = formData.get("field_type")?.toString() as
    | "text"
    | "number"
    | "date"
    | "boolean"
    | "select";
  const is_required = formData.get("is_required") === "true";
  const optionsRaw = formData.get("options")?.toString();
  const options = optionsRaw ? JSON.parse(optionsRaw) : null;

  if (!label) return { success: false, error: "Label is required" };
  if (field_type === "select" && (!options || options.length === 0)) {
    return {
      success: false,
      error: "Select fields must have at least one option",
    };
  }

  const data = {
    office_id: admin.office_id,
    label,
    field_type,
    is_required,
    options: field_type === "select" ? options : null,
    is_active: true,
  };

  const { error } = id
    ? await supabase.from("custom_fields").update(data).eq("id", id)
    : await supabase.from("custom_fields").insert(data);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateCustomFieldsOrderAction(
  ids: string[]
): Promise<ActionResult> {
  const supabase = await createClient();

  const updates = ids.map((id, index) =>
    supabase.from("custom_fields").update({ sort_order: index }).eq("id", id)
  );

  await Promise.all(updates);

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleCustomFieldAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("custom_fields")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
