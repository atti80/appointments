"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toLocalISO } from "../date";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Create single slot ─────────────────────────────────────────────────────

export async function createSlotAction(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const practitioner_id = formData.get("practitioner_id")?.toString();
  const starts_at = formData.get("starts_at")?.toString();
  const ends_at = formData.get("ends_at")?.toString();
  const slot_type_id = formData.get("slot_type_id")?.toString() || null;

  console.log("Creating slot with:", {
    practitioner_id,
    starts_at,
    ends_at,
    slot_type_id,
  });

  if (!practitioner_id)
    return { success: false, error: "Practitioner is required" };
  if (!starts_at) return { success: false, error: "Start time is required" };
  if (!ends_at) return { success: false, error: "End time is required" };

  if (new Date(ends_at) <= new Date(starts_at)) {
    return { success: false, error: "End time must be after start time" };
  }

  // Check for conflicts
  const { data: conflicts } = await serviceClient
    .from("slots")
    .select("id")
    .eq("practitioner_id", practitioner_id)
    .lt("starts_at", ends_at)
    .gt("ends_at", starts_at);

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: "This time slot overlaps with an existing slot",
    };
  }

  const { error } = await serviceClient.from("slots").insert({
    office_id: admin.office_id,
    practitioner_id,
    starts_at,
    ends_at,
    slot_type_id,
    status: "available",
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ─── Delete slot ────────────────────────────────────────────────────────────

export async function deleteSlotAction(slotId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  // Never delete a booked or pending slot
  const { data: slot } = await serviceClient
    .from("slots")
    .select("status")
    .eq("id", slotId)
    .single();

  if (!slot) return { success: false, error: "Slot not found" };

  if (slot.status === "booked") {
    return { success: false, error: "Cannot delete a booked slot" };
  }

  if (slot.status === "pending") {
    return {
      success: false,
      error: "Cannot delete a slot with a pending booking",
    };
  }

  const { error } = await serviceClient
    .from("slots")
    .delete()
    .eq("id", slotId)
    .eq("office_id", admin.office_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ─── Apply template ─────────────────────────────────────────────────────────

export async function applyTemplateAction(
  templateId: string,
  practitionerId: string,
  targetDate: string // ISO date string YYYY-MM-DD, used as anchor day
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id, office:offices(default_slot_minutes)")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const { data: template } = await serviceClient
    .from("templates")
    .select("*, template_slots(*)")
    .eq("id", templateId)
    .single();

  if (!template) return { success: false, error: "Template not found" };

  const anchor = new Date(targetDate);
  const dayOfWeek = anchor.getDay();

  // Build proposed slots
  const proposed: {
    starts_at: string;
    ends_at: string;
    slot_type_id: string | null;
  }[] = [];

  for (const ts of template.template_slots as any[]) {
    let slotDate: Date;

    if (template.type === "daily") {
      slotDate = anchor;
    } else {
      // weekly — map day_of_week to the actual date in the anchor's week
      const diff = parseInt(ts.day_of_week) - dayOfWeek;
      slotDate = new Date(anchor);
      slotDate.setDate(anchor.getDate() + diff);
    }

    const [startHour, startMin] = ts.start_time.split(":").map(Number);
    const [endHour, endMin] = ts.end_time.split(":").map(Number);

    const starts_at = new Date(slotDate);
    starts_at.setHours(startHour, startMin, 0, 0);

    const ends_at = new Date(slotDate);
    ends_at.setHours(endHour, endMin, 0, 0);

    proposed.push({
      starts_at: toLocalISO(slotDate, startHour, startMin),
      ends_at: toLocalISO(slotDate, endHour, endMin),
      slot_type_id: ts.slot_type_id ?? null,
    });
  }

  // Check conflicts via our database function
  const { data: conflicts } = await serviceClient.rpc(
    "check_template_conflicts",
    {
      p_practitioner_id: practitionerId,
      p_starts_at: proposed.map((p) => p.starts_at),
      p_ends_at: proposed.map((p) => p.ends_at),
    }
  );

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: JSON.stringify({
        type: "conflicts",
        conflicts: conflicts,
        proposed: proposed,
      }),
    };
  }

  // Insert all proposed slots
  const { error } = await serviceClient.from("slots").insert(
    proposed.map((p) => ({
      office_id: admin.office_id,
      practitioner_id: practitionerId,
      starts_at: p.starts_at,
      ends_at: p.ends_at,
      slot_type_id: p.slot_type_id,
      status: "available" as const,
    }))
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/calendar");
  return { success: true, data: { created: proposed.length, skipped: 0 } };
}

// ─── Apply template after conflict confirmation ─────────────────────────────
// Called when admin has seen the conflict warning and chosen to skip conflicts

export async function applyTemplateSkipConflictsAction(
  templateId: string,
  practitionerId: string,
  proposed: {
    starts_at: string;
    ends_at: string;
    slot_type_id: string | null;
  }[],
  conflictingStartTimes: string[]
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("office_id")
    .single();

  if (!admin) return { success: false, error: "Not authenticated" };

  const toInsert = proposed.filter(
    (p) => !conflictingStartTimes.includes(p.starts_at)
  );

  if (toInsert.length === 0) {
    return {
      success: false,
      error: "All proposed slots conflict with existing ones",
    };
  }

  const { error } = await serviceClient.from("slots").insert(
    toInsert.map((p) => ({
      office_id: admin.office_id,
      practitioner_id: practitionerId,
      starts_at: p.starts_at,
      ends_at: p.ends_at,
      slot_type_id: p.slot_type_id,
      status: "available" as const,
    }))
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/calendar");
  return {
    success: true,
    data: { created: toInsert.length, skipped: conflictingStartTimes.length },
  };
}
