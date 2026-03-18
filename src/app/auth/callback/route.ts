import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code       = searchParams.get("code");
  const tokenHash  = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "signup" | "recovery" | "email" | null;
  const next       = searchParams.get("next") ?? "/home";

  // Resolve public-facing origin (Vercel proxies the request)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `${proto}://${forwardedHost}`;

  if (!code && !tokenHash) {
    return NextResponse.redirect(`${base}/login?error=no_code_returned`);
  }

  const cookieStore = cookies();
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  let authError: string | null = null;
  let userId: string | null = null;

  if (code) {
    // OAuth / PKCE flow (Google, LinkedIn, magic link)
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      authError = error.message;
    } else {
      userId = data.session?.user?.id ?? null;
      // Sync OAuth metadata to profile
      if (data.session?.user) {
        const u    = data.session.user;
        const meta = u.user_metadata ?? {};
        const update: Record<string, string | null> = { id: u.id };
        if (meta.full_name ?? meta.name)                        update.full_name  = meta.full_name ?? meta.name;
        if (meta.avatar_url ?? meta.picture)                    update.avatar_url = meta.avatar_url ?? meta.picture;
        if (meta.headline ?? meta.job_title ?? meta.title)      update.role       = meta.headline ?? meta.job_title ?? meta.title;
        if (meta.company ?? meta.organization ?? meta.employer) update.company    = meta.company ?? meta.organization ?? meta.employer;
        await supabase.from("profiles").upsert(update, { onConflict: "id" });
      }
    }
  } else if (tokenHash && type) {
    // Email confirmation flow (signup verify, password reset, etc.)
    const { error, data } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      authError = error.message;
    } else {
      userId = data.session?.user?.id ?? null;
    }
  }

  if (authError) {
    const response = NextResponse.redirect(`${base}/login?error=${encodeURIComponent(authError)}`);
    for (const { name, value, options } of pendingCookies) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.cookies.set(name, value, options as any);
    }
    return response;
  }

  // Decide where to send the user
  let destination: string;
  if (next !== "/home") {
    destination = `${base}${next}`;
  } else {
    // Check whether this user has completed onboarding
    let onboardingComplete = false;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .single();
      onboardingComplete = profile?.onboarding_complete ?? false;
    }
    destination = onboardingComplete ? `${base}/home` : `${base}/onboarding`;
  }

  const response = NextResponse.redirect(destination);
  for (const { name, value, options } of pendingCookies) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any);
  }
  return response;
}
