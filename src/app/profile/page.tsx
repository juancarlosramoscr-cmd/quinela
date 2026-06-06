import { redirect } from "next/navigation";

import ProfileForm from "@/app/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile — Quinela" };

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already protects /profile, but guard here too for safety.
  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Your profile</h1>
      <p className="mb-6 text-sm text-slate-500">{user.email}</p>
      <ProfileForm initialName={profile?.display_name ?? ""} />
    </div>
  );
}
