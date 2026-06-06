"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  ok: boolean;
  message: string;
};

/** Server action: update the signed-in user's display_name. */
export async function updateDisplayName(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!displayName) {
    return { ok: false, message: "Display name cannot be empty." };
  }
  if (displayName.length > 40) {
    return { ok: false, message: "Display name must be 40 characters or fewer." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}
