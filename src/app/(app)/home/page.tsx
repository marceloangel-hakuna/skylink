import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SkyBriefing from "@/components/SkyBriefing";

export const dynamic = "force-dynamic";

type FlightPhase = "none" | "far" | "near" | "boarding" | "inflight" | "landed";

function detectPhase(departureDate: string | null): FlightPhase {
  if (!departureDate) return "none";
  const dep = new Date(departureDate + "T00:00:00");
  const h = (dep.getTime() - Date.now()) / 3600000;
  if (h < -3) return "landed";
  if (h < 0)  return "inflight";
  if (h < 1)  return "boarding";
  if (h < 6)  return "near";
  return "far";
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete, full_name")
      .eq("id", user.id)
      .single();
    if (!profile?.onboarding_complete) redirect("/onboarding");
  }

  const uid = user?.id ?? "";

  const [profileRes, flightRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", uid).single(),
    supabase.from("user_flights")
      .select("flight_number, origin, destination, departure_date")
      .eq("user_id", uid)
      .in("status", ["upcoming", "active"])
      .order("departure_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const meta     = user?.user_metadata ?? {};
  const fullName = profileRes.data?.full_name ?? meta.full_name ?? meta.name ?? "there";
  const firstName = String(fullName).split(" ")[0];

  const flight = flightRes.data;
  const phase  = detectPhase(flight?.departure_date ?? null);

  return (
    <SkyBriefing
      firstName={firstName}
      phase={phase}
      flightNumber={flight?.flight_number ?? null}
      origin={flight?.origin ?? null}
      destination={flight?.destination ?? null}
    />
  );
}
