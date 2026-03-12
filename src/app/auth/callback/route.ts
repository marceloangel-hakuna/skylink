import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  // Resolve public-facing origin (Vercel proxies the request)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const base =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : `${proto}://${forwardedHost}`;

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=no_code_returned`);
  }

  const cookieStore = cookies();

  // Collect cookies that Supabase wants to set during the exchange
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
          // Buffer cookies — we'll attach them to the response below
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  let destination: string;
  if (error) {
    destination = `${base}/login?error=${encodeURIComponent(error.message)}`;
  } else if (next !== "/home") {
    // Explicit `next` param — honour it
    destination = `${base}${next}`;
  } else {
    // Check whether this user has completed onboarding
    const userId = data.session?.user?.id;
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

  // Attach session cookies to the redirect response so the browser
  // stores them before following the redirect to /home
  for (const { name, value, options } of pendingCookies) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any);
  }

  return response;
}
