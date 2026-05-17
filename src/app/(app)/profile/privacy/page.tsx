"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";

type Settings = {
  show_seat: boolean;
  show_company: boolean;
  show_interests: boolean;
  discoverable: boolean;
  allow_connections: "everyone" | "mutual" | "nobody";
};

const DEFAULTS: Settings = {
  show_seat: true,
  show_company: true,
  show_interests: true,
  discoverable: true,
  allow_connections: "everyone",
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 transition-colors duration-200"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? "#4A27E8" : "var(--c-border)",
        position: "relative",
      }}
    >
      <div
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 23px)" : 3 }}
      />
    </button>
  );
}

function Row({ icon, label, sub, right }: { icon: React.ReactNode; label: string; sub?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={{ color: "var(--c-text2)" }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px]" style={{ color: "var(--c-text1)" }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text3)" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/privacy")
      .then(r => r.json())
      .then(data => {
        setSettings(s => ({ ...s, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: Settings) => {
    setSaving(true);
    await fetch("/api/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
  }, []);

  function toggle(key: keyof Omit<Settings, "allow_connections">) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    save(next);
  }

  function setAllowConnections(val: Settings["allow_connections"]) {
    const next = { ...settings, allow_connections: val };
    setSettings(next);
    save(next);
  }

  const divider = <div style={{ height: 1, background: "var(--c-border)", marginLeft: 36 }} />;

  return (
    <div className="animate-fade-in pb-[120px]">
      <PageHeader title="Privacy" showBack backHref="/profile" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "var(--c-muted)" }} />
            ))}
          </div>
        ) : (
          <>
            {/* Visibility */}
            <div className="card flex flex-col px-4 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: "var(--c-text3)" }}>
                What Others Can See
              </p>
              <Row
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 4V2M16 4V2M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                label="Seat Number"
                sub="Show your seat to other passengers"
                right={<Toggle on={settings.show_seat} onToggle={() => toggle("show_seat")} />}
              />
              {divider}
              <Row
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21V8l9-6 9 6v13H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                label="Company"
                sub="Show where you work"
                right={<Toggle on={settings.show_company} onToggle={() => toggle("show_company")} />}
              />
              {divider}
              <Row
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}
                label="Interests"
                sub="Show your professional interests"
                right={<Toggle on={settings.show_interests} onToggle={() => toggle("show_interests")} />}
              />
              <div className="pb-1" />
            </div>

            {/* Discoverability */}
            <div className="card flex flex-col px-4 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: "var(--c-text3)" }}>
                Discoverability
              </p>
              <Row
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                label="Discoverable on Flights"
                sub="Let other passengers find and connect with you"
                right={<Toggle on={settings.discoverable} onToggle={() => toggle("discoverable")} />}
              />
              <div className="pb-1" />
            </div>

            {/* Connection requests */}
            <div className="card flex flex-col px-4 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: "var(--c-text3)" }}>
                Connection Requests
              </p>
              {(["everyone", "mutual", "nobody"] as const).map((opt, i, arr) => (
                <div key={opt}>
                  <button
                    onClick={() => setAllowConnections(opt)}
                    className="flex items-center gap-3 w-full py-3.5 active:opacity-70 transition-opacity"
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: settings.allow_connections === opt ? "#4A27E8" : "var(--c-border)",
                        background: settings.allow_connections === opt ? "#4A27E8" : "transparent",
                      }}
                    >
                      {settings.allow_connections === opt && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[15px]" style={{ color: "var(--c-text1)" }}>
                        {opt === "everyone" ? "Everyone" : opt === "mutual" ? "Mutual connections only" : "Nobody"}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text3)" }}>
                        {opt === "everyone"
                          ? "Anyone on SkyLink can request to connect"
                          : opt === "mutual"
                          ? "Only people with shared connections"
                          : "Pause all connection requests"}
                      </p>
                    </div>
                  </button>
                  {i < arr.length - 1 && divider}
                </div>
              ))}
              <div className="pb-1" />
            </div>

            {/* Info */}
            <div className="flex items-start gap-2.5 px-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--c-text3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--c-text3)" }}>
                Your email address is never shared. These settings apply to your profile visibility on all current and future flights.
                {saving ? " Saving…" : " Changes save automatically."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
