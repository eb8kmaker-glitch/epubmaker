"use server";

import { createServerClient, createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function signOut(locale: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

export async function changePassword(
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

export async function deleteAccount(
  locale: string
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
