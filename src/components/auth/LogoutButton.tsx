"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-3 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-950/40 active:scale-[0.97] transition-all"
    >
      Sign out
    </button>
  );
}
