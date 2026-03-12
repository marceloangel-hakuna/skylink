import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // In production Vercel sits behind a proxy — use x-forwarded-host
      // so the redirect goes to the real public domain, not an internal address.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";

      const redirectBase = isLocal
        ? origin
        : `https://${forwardedHost ?? new URL(request.url).host}`;

      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  // Exchange failed — send back to login
  const errorBase =
    process.env.NODE_ENV === "development"
      ? origin
      : `https://${request.headers.get("x-forwarded-host") ?? new URL(request.url).host}`;

  return NextResponse.redirect(`${errorBase}/login?error=auth_failed`);
}
