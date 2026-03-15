"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConnectButton({ targetId, targetName }: { targetId: string; targetName: string }) {
  const [state,    setState]    = useState<"idle" | "composing" | "sent">("idle");
  const [message, setMessage]  = useState("");
  const [sending, setSending]  = useState(false);

  const send = async () => {
    setSending(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("connections").insert({
      requester_id: user.id,
      receiver_id:  targetId,
      status:       "pending",
      message:      message.trim() || null,
    });
    setState("sent");
    setSending(false);
  };

  if (state === "sent") {
    return (
      <button disabled
        className="w-full py-3 rounded-2xl text-sm font-semibold border opacity-80"
        style={{ borderColor: "#34D399", color: "#059669" }}>
        Request Sent ✓
      </button>
    );
  }

  if (state === "composing") {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          autoFocus
          rows={3}
          placeholder={`Say why you'd like to connect with ${targetName.split(" ")[0]}…`}
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            background: "var(--c-muted)", color: "var(--c-text1)",
            border: "1px solid var(--c-border)",
            ["--tw-ring-color" as string]: "#4A27E8",
          }}
        />
        <div className="flex gap-2">
          <button onClick={() => setState("idle")}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold border"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text2)" }}>
            Cancel
          </button>
          <button onClick={send} disabled={sending}
            className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "#4A27E8" }}>
            {sending ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("composing")}
      className="w-full py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
      style={{ background: "#4A27E8" }}>
      Connect
    </button>
  );
}
