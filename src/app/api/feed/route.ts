import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type FeedItem = {
  id: string;
  agent: string;
  type: string;
  title: string;
  body: string;
  actions: unknown;
  priority: string;
  read: boolean;
  dismissed: boolean;
  expires_at: string | null;
  created_at: string;
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("feed_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("dismissed", false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items: FeedItem[] = (data ?? []).sort((a, b) => {
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ items });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, dismissed, read } = body as {
    id: string;
    dismissed?: boolean;
    read?: boolean;
  };

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (dismissed !== undefined) updates.dismissed = dismissed;
  if (read !== undefined) updates.read = read;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("feed_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
