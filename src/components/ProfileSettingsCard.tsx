"use client";

import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 transition-colors duration-200"
      style={{
        width: "44px",
        height: "26px",
        borderRadius: "13px",
        background: on ? "#4A27E8" : "var(--c-border)",
        position: "relative",
      }}
    >
      <div
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 23px)" : "3px" }}
      />
    </button>
  );
}

function SettingsRow({
  icon,
  label,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={{ color: "var(--c-text2)" }}>
        {icon}
      </span>
      <span className="flex-1 text-[15px]" style={{ color: "var(--c-text1)" }}>{label}</span>
      {right}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--c-text3)" }}>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileSettingsCard() {
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [bleMesh, setBleMesh] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const divider = <div style={{ height: "1px", background: "var(--c-border)", marginLeft: "36px" }} />;

  return (
    <>
      {/* SETTINGS */}
      <div className="card flex flex-col px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: "var(--c-text3)" }}>
          Settings
        </p>

        <SettingsRow
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          label="Dark Mode"
          right={<Toggle on={theme === "dark"} onToggle={toggle} />}
        />
        {divider}
        <SettingsRow
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          label="Notifications"
          right={<Toggle on={notifications} onToggle={() => setNotifications(v => !v)} />}
        />
        {divider}
        <SettingsRow
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 17.7a8 8 0 0 0 0-11.4M3.5 3.5a13 13 0 0 0 0 17M20.5 20.5a13 13 0 0 0 0-17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          label="BLE Mesh"
          right={<Toggle on={bleMesh} onToggle={() => setBleMesh(v => !v)} />}
        />
        {divider}
        <Link href="/profile/privacy" className="flex items-center gap-3 py-3.5 active:opacity-70 transition-opacity">
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={{ color: "var(--c-text2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex-1 text-[15px]" style={{ color: "var(--c-text1)" }}>Privacy</span>
          <ChevronRight />
        </Link>
        <div className="pb-1" />
      </div>

      {/* ACCOUNT */}
      <div className="card flex flex-col px-4 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: "var(--c-text3)" }}>
          Account
        </p>

        <Link href="/profile/edit" className="flex items-center gap-3 py-3.5 active:opacity-70 transition-opacity">
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={{ color: "var(--c-text2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="flex-1 text-[15px]" style={{ color: "var(--c-text1)" }}>Personal Info</span>
          <ChevronRight />
        </Link>
        {divider}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 py-3.5 active:opacity-70 transition-opacity"
        >
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold" style={{ color: "#EF4444" }}>Sign Out</span>
        </button>
        <div className="pb-1" />
      </div>
    </>
  );
}
