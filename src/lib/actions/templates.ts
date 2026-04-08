"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Create template ────────────────────────────────────────────────────────

export async function createTemplateAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString() as "daily" | "weekly";

  if (!name) return { success: false, error: "Name is required" };
  if (!type) return { success: false, error: "Type is required" };

  const { data, error } = await supabase
    .from("templates")
    .insert({ office_id: admin.office_id, name, type })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true, data: { id: data.id } };
}

// ─── Update template ────────────────────────────────────────────────────────

export async function updateTemplateAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();

  if (!id) return { success: false, error: "Template ID is required" };
  if (!name) return { success: false, error: "Name is required" };

  const { error } = await supabase
    .from("templates")
    .update({ name })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true };
}

// ─── Delete template ────────────────────────────────────────────────────────

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("templates").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true };
}

// ─── Upsert template slot ───────────────────────────────────────────────────

export async function upsertTemplateSlotAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const id = formData.get("id")?.toString() || null;
  const template_id = formData.get("template_id")?.toString();
  const start_time = formData.get("start_time")?.toString();
  const end_time = formData.get("end_time")?.toString();
  const slot_type_id = formData.get("slot_type_id")?.toString() || null;
  const day_of_week = formData.get("day_of_week")?.toString() || null;

  if (!template_id) return { success: false, error: "Template ID is required" };
  if (!start_time) return { success: false, error: "Start time is required" };
  if (!end_time) return { success: false, error: "End time is required" };
  if (end_time <= start_time)
    return { success: false, error: "End time must be after start time" };

  // Check for overlapping slots in same template
  const query = supabase
    .from("template_slots")
    .select("id")
    .eq("template_id", template_id)
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  // When editing, exclude the current slot
  if (id) query.neq("id", id);

  // For weekly templates, only check same day
  if (day_of_week) {
    query.eq(
      "day_of_week",
      day_of_week as "0" | "1" | "2" | "3" | "4" | "5" | "6"
    );
  }

  const { data: overlapping } = await query.maybeSingle();

  if (overlapping) {
    return {
      success: false,
      error: "This slot overlaps with an existing slot in this template",
    };
  }

  const data = {
    template_id,
    start_time,
    end_time,
    slot_type_id,
    day_of_week: day_of_week as "0" | "1" | "2" | "3" | "4" | "5" | "6" | null,
  };

  const { error } = id
    ? await supabase.from("template_slots").update(data).eq("id", id)
    : await supabase.from("template_slots").insert(data);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true };
}

// ─── Delete template slot ───────────────────────────────────────────────────

export async function deleteTemplateSlotAction(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("template_slots").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true };
}
