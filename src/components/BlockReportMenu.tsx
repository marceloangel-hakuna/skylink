"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REPORT_REASONS = [
  "Spam or unwanted content",
  "Inappropriate behavior",
  "Fake or misleading profile",
  "Harassment",
  "Other",
];

export default function BlockReportMenu({
  targetId,
  targetName,
}: {
  targetId: string;
  targetName: string;
}) {
  const [sheet, setSheet] = useState<"none" | "menu" | "report" | "blocked">("none");
  const [reportReason, setReportReason] = useState("");
  const [working, setWorking] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleBlock() {
    setWorking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_blocks").upsert(
        { blocker_id: user.id, blocked_id: targetId },
        { onConflict: "blocker_id,blocked_id" }
      );
      setSheet("blocked");
    } finally {
      setWorking(false);
    }
  }

  async function handleReport() {
    if (!reportReason) return;
    setWorking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_blocks").upsert(
        { blocker_id: user.id, blocked_id: targetId, reason: reportReason },
        { onConflict: "blocker_id,blocked_id" }
      );
      setSheet("none");
      // Brief success feedback
      router.back();
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setSheet("menu")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl active:opacity-70 transition-opacity"
        style={{ background: "var(--c-muted)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
        </svg>
        <span className="text-sm font-medium">More options</span>
      </button>

      {/* Backdrop */}
      {sheet !== "none" && (
        <div
          className="fixed inset-0"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 55 }}
          onClick={() => sheet !== "blocked" && setSheet("none")}
        />
      )}

      {/* Menu sheet */}
      {sheet === "menu" && (
        <div
          className="fixed left-1/2 w-full rounded-t-[28px] flex flex-col"
          style={{
            bottom: 0,
            maxWidth: 430,
            transform: "translateX(-50%)",
            background: "var(--c-card)",
            borderTop: "1px solid var(--c-border)",
            zIndex: 60,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
          </div>
          <p className="px-4 py-3 text-[13px] font-semibold" style={{ color: "var(--c-text3)" }}>
            {targetName}
          </p>
          <button
            onClick={() => setSheet("report")}
            className="flex items-center gap-3 px-4 py-4 active:opacity-70 transition-opacity"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "#F5A623" }}>
              <path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 9v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="text-[15px]" style={{ color: "var(--c-text1)" }}>Report</span>
          </button>
          <button
            onClick={handleBlock}
            disabled={working}
            className="flex items-center gap-3 px-4 py-4 active:opacity-70 transition-opacity"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "#EF4444" }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M5.7 5.7l12.6 12.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="text-[15px] font-semibold" style={{ color: "#EF4444" }}>
              {working ? "Blocking…" : "Block User"}
            </span>
          </button>
          <button
            onClick={() => setSheet("none")}
            className="flex items-center justify-center px-4 py-4 active:opacity-70 transition-opacity"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
            <span className="text-[15px] font-semibold" style={{ color: "var(--c-text2)" }}>Cancel</span>
          </button>
        </div>
      )}

      {/* Report reasons sheet */}
      {sheet === "report" && (
        <div
          className="fixed left-1/2 w-full rounded-t-[28px] flex flex-col"
          style={{
            bottom: 0,
            maxWidth: 430,
            transform: "translateX(-50%)",
            background: "var(--c-card)",
            borderTop: "1px solid var(--c-border)",
            zIndex: 60,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
          </div>
          <p className="px-4 py-3 text-[17px] font-bold" style={{ color: "var(--c-text1)" }}>
            Report {targetName.split(" ")[0]}
          </p>
          <p className="px-4 pb-3 text-[13px]" style={{ color: "var(--c-text3)" }}>
            Select a reason. Your report is confidential.
          </p>
          <div style={{ borderTop: "1px solid var(--c-border)" }}>
            {REPORT_REASONS.map((reason, i) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className="flex items-center gap-3 w-full px-4 py-3.5 active:opacity-70 transition-opacity"
                style={{ borderBottom: i < REPORT_REASONS.length - 1 ? "1px solid var(--c-border)" : "none" }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: reportReason === reason ? "#4A27E8" : "var(--c-border)",
                    background: reportReason === reason ? "#4A27E8" : "transparent",
                  }}
                >
                  {reportReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-[15px]" style={{ color: "var(--c-text1)" }}>{reason}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 px-4 pt-4">
            <button
              onClick={() => setSheet("menu")}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--c-muted)", color: "var(--c-text2)", border: "1px solid var(--c-border)" }}
            >
              Back
            </button>
            <button
              onClick={handleReport}
              disabled={!reportReason || working}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#EF4444" }}
            >
              {working ? "Sending…" : "Submit Report"}
            </button>
          </div>
        </div>
      )}

      {/* Blocked confirmation */}
      {sheet === "blocked" && (
        <div
          className="fixed left-1/2 w-full rounded-t-[28px] flex flex-col"
          style={{
            bottom: 0,
            maxWidth: 430,
            transform: "translateX(-50%)",
            background: "var(--c-card)",
            borderTop: "1px solid var(--c-border)",
            zIndex: 60,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
          </div>
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
                 style={{ background: "rgba(239,68,68,0.1)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#EF4444" }}>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M5.7 5.7l12.6 12.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[17px] font-bold" style={{ color: "var(--c-text1)" }}>
                {targetName.split(" ")[0]} has been blocked
              </p>
              <p className="text-[13px] mt-1" style={{ color: "var(--c-text3)" }}>
                They won&apos;t be able to see your profile or contact you.
              </p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white mt-2"
              style={{ background: "#4A27E8" }}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </>
  );
}
