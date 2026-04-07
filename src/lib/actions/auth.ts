"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email and password" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: "Invalid email or password" };
  }

  // Verify the user has an active admin record
  const { data: admin } = await supabase
    .from("admins")
    .select("id, is_active")
    .single();

  if (!admin) {
    await supabase.auth.signOut();
    return { success: false, error: "No admin account found for this email" };
  }

  if (!admin.is_active) {
    await supabase.auth.signOut();
    return {
      success: false,
      error:
        "Your account has been deactivated. Contact your office administrator.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function sendInviteAction(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email")?.toString().trim();
  if (!email) return { success: false, error: "Email is required" };

  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: currentAdmin } = await supabase
    .from("admins")
    .select("id, office_id")
    .single();

  if (!currentAdmin) return { success: false, error: "Admin record not found" };

  // Check for existing pending invite
  const { data: existingInvite } = await serviceClient
    .from("admin_invites")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return {
      success: false,
      error: "A pending invite already exists for this email",
    };
  }

  // Check not already an admin
  const { data: existingAdmin } = await serviceClient
    .from("admins")
    .select("id")
    .eq("email", email)
    .eq("office_id", currentAdmin.office_id)
    .maybeSingle();

  if (existingAdmin) {
    return {
      success: false,
      error: "This person is already an admin for this office",
    };
  }

  // Send invite via Supabase Auth
  const { error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept`,
      data: { office_id: currentAdmin.office_id },
    });

  if (inviteError) {
    return {
      success: false,
      error: "Failed to send invite. Please try again.",
    };
  }

  // Record in our table
  await serviceClient.from("admin_invites").insert({
    office_id: currentAdmin.office_id,
    invited_by_admin_id: currentAdmin.id,
    email,
    status: "pending",
  });

  return { success: true };
}

export async function acceptInviteAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = formData.get("name")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name) return { success: false, error: "Name is required" };
  if (!password || password.length < 8)
    return { success: false, error: "Password must be at least 8 characters" };

  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return {
      success: false,
      error: "Session not found. Please use the link from your invite email.",
    };
  }

  const { data: invite } = await serviceClient
    .from("admin_invites")
    .select("id, office_id, expires_at")
    .eq("email", user.email)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return { success: false, error: "No pending invite found for this email." };
  }

  if (new Date(invite.expires_at) < new Date()) {
    await serviceClient
      .from("admin_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return {
      success: false,
      error: "This invite has expired. Ask an admin to send a new one.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return {
      success: false,
      error: "Failed to set password. Please try again.",
    };
  }

  const { error: adminError } = await serviceClient.from("admins").insert({
    user_id: user.id,
    office_id: invite.office_id,
    name,
    email: user.email,
  });

  if (adminError) {
    return {
      success: false,
      error: "Failed to create admin account. Please contact support.",
    };
  }

  await serviceClient
    .from("admin_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  redirect("/dashboard");
}
