"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a stable Supabase browser client.
 * Use this inside Client Components.
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
