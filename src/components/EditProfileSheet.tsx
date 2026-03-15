"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initial: { role: string; company: string; bio: string };
};

export default function EditProfileSheet({ initial }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [role,    setRole]    = useState(initial.role);
  const [company, setCompany] = useState(initial.company);
  const [bio,     setBio]     = useState(initial.bio);
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    setSaving(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("profiles").upsert({
      id:      user.id,
      role:    role.trim()    || null,
      company: company.trim() || null,
      bio:     bio.trim()     || null,
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
        style={{ background: "var(--c-muted)", color: "#4A27E8", border: "1px solid #4A27E840" }}
      >
        ✏️ Edit Profile
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative rounded-t-3xl w-full max-w-[430px]"
            style={{
              background: "var(--c-card)",
              paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
            </div>

            <div className="px-5 pb-2 flex items-center justify-between">
              <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>Edit Profile</h3>
              <button onClick={() => setOpen(false)} className="text-sm" style={{ color: "var(--c-text3)" }}>Cancel</button>
            </div>

            <div className="px-5 flex flex-col gap-4 mt-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text3)" }}>Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Co-founder, VP Engineering"
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--c-muted)", color: "var(--c-text1)",
                    border: "1px solid var(--c-border)",
                    ["--tw-ring-color" as string]: "#4A27E8",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text3)" }}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, OpenAI, Independent"
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--c-muted)", color: "var(--c-text1)",
                    border: "1px solid var(--c-border)",
                    ["--tw-ring-color" as string]: "#4A27E8",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text3)" }}>
                  Bio <span className="normal-case font-normal" style={{ color: "var(--c-text3)" }}>(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={280}
                  placeholder="What are you building or investing in?"
                  className="w-full px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2"
                  style={{
                    background: "var(--c-muted)", color: "var(--c-text1)",
                    border: "1px solid var(--c-border)",
                    ["--tw-ring-color" as string]: "#4A27E8",
                  }}
                />
                <p className="text-xs text-right mt-1" style={{ color: "var(--c-text3)" }}>{bio.length}/280</p>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 mt-1"
                style={{ background: "#4A27E8" }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
