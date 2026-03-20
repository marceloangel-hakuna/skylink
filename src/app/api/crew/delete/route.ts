import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { crewId } = await req.json();
  if (!crewId) return NextResponse.json({ error: "Missing crewId" }, { status: 400 });

  // Verify the caller is authenticated
  const cookieStore = cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use service role to bypass RLS for the cascade delete
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Cascade: post likes → event rsvps → posts → events → members → crew
  const { data: posts } = await admin.from("crew_posts").select("id").eq("crew_id", crewId);
  const postIds = (posts ?? []).map((p: { id: string }) => p.id);
  if (postIds.length > 0) await admin.from("crew_post_likes").delete().in("post_id", postIds);

  const { data: events } = await admin.from("crew_events").select("id").eq("crew_id", crewId);
  const eventIds = (events ?? []).map((e: { id: string }) => e.id);
  if (eventIds.length > 0) await admin.from("crew_event_rsvps").delete().in("event_id", eventIds);

  await admin.from("crew_posts").delete().eq("crew_id", crewId);
  await admin.from("crew_events").delete().eq("crew_id", crewId);
  await admin.from("crew_members").delete().eq("crew_id", crewId);

  const { error } = await admin.from("crews").delete().eq("id", crewId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
