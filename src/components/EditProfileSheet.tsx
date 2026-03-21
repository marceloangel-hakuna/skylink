"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AiMlIcon, FintechIcon, ClimateIcon, SaasIcon, Web3Icon,
  DesignIcon, VCIcon, ProductIcon, DevToolsIcon, BiotechIcon,
} from "@/components/icons/AppIcons";

const INTERESTS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "ai_ml",    label: "AI / ML",     icon: <AiMlIcon    size={16} /> },
  { id: "fintech",  label: "Fintech",      icon: <FintechIcon size={16} /> },
  { id: "climate",  label: "Climate Tech", icon: <ClimateIcon size={16} /> },
  { id: "saas",     label: "SaaS",         icon: <SaasIcon    size={16} /> },
  { id: "web3",     label: "Web3",         icon: <Web3Icon    size={16} /> },
  { id: "design",   label: "Design",       icon: <DesignIcon  size={16} /> },
  { id: "vc",       label: "VC",           icon: <VCIcon      size={16} /> },
  { id: "product",  label: "Product",      icon: <ProductIcon size={16} /> },
  { id: "devtools", label: "DevTools",     icon: <DevToolsIcon size={16} /> },
  { id: "biotech",  label: "Biotech",      icon: <BiotechIcon size={16} /> },
];

type Props = {
  initial: {
    fullName: string;
    role: string;
    company: string;
    bio: string;
    avatarUrl: string | null;
    interests: string[];
    linkedinUrl?: string;
    xHandle?: string;
    websiteUrl?: string;
    otherUrl?: string;
  };
};

function FieldInput({
  label, value, onChange, placeholder, prefix, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; prefix?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
             style={{ color: "var(--c-text3)" }}>{label}</label>
      <div className="flex items-center rounded-2xl overflow-hidden"
           style={{ background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
        {prefix && (
          <span className="pl-4 pr-1 text-sm flex-shrink-0" style={{ color: "var(--c-text3)" }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent"
          style={{ paddingLeft: prefix ? "4px" : undefined, color: "var(--c-text1)" }}
        />
      </div>
    </div>
  );
}

export default function EditProfileSheet({ initial }: Props) {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [open,          setOpen]          = useState(false);
  const [fullName,      setFullName]      = useState(initial.fullName);
  const [role,          setRole]          = useState(initial.role);
  const [company,       setCompany]       = useState(initial.company);
  const [bio,           setBio]           = useState(initial.bio);
  const [interests,     setInterests]     = useState<string[]>(initial.interests);
  const [linkedinUrl,   setLinkedinUrl]   = useState(initial.linkedinUrl ?? "");
  const [xHandle,       setXHandle]       = useState(initial.xHandle ?? "");
  const [websiteUrl,    setWebsiteUrl]    = useState(initial.websiteUrl ?? "");
  const [otherUrl,      setOtherUrl]      = useState(initial.otherUrl ?? "");
  const [avatarUrl]     = useState<string | null>(initial.avatarUrl);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [mounted,       setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function toggleInterest(id: string) {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id)
      : prev.length >= 5 ? prev
      : [...prev, id]
    );
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function resizeToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const SIZE = 400;
        const canvas = document.createElement("canvas");
        const scale  = Math.min(SIZE / img.width, SIZE / img.height, 1);
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = url;
    });
  }

  const save = async () => {
    setSaving(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    let finalAvatarUrl = avatarUrl;
    if (avatarFile) {
      finalAvatarUrl = await resizeToBase64(avatarFile);
    }

    await sb.from("profiles").upsert({
      id:           user.id,
      full_name:    fullName.trim()    || null,
      role:         role.trim()        || null,
      company:      company.trim()     || null,
      bio:          bio.trim()         || null,
      avatar_url:   finalAvatarUrl,
      interests,
      linkedin_url: linkedinUrl.trim() || null,
      x_handle:     xHandle.trim().replace(/^@/, "") || null,
      website_url:  websiteUrl.trim()  || null,
      other_url:    otherUrl.trim()    || null,
    });

    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const displayAvatar = avatarPreview ?? avatarUrl;
  const initials = fullName.trim()
    ? fullName.trim().split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : "?";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold px-4 py-1.5 rounded-xl active:scale-95 transition-transform flex-shrink-0"
        style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)" }}
      >
        Edit
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative rounded-t-3xl w-full max-w-[430px] overflow-y-auto"
            style={{
              background: "var(--c-card)",
              maxHeight: "92dvh",
              paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Handle */}
            <div className="sticky top-0 flex justify-center pt-3 pb-2 z-10" style={{ background: "var(--c-card)" }}>
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--c-border)" }} />
            </div>

            <div className="px-5 pb-2 flex items-center justify-between">
              <h3 className="text-base font-black" style={{ color: "var(--c-text1)" }}>Edit Profile</h3>
              <button onClick={() => setOpen(false)} className="text-sm" style={{ color: "var(--c-text3)" }}>Cancel</button>
            </div>

            <div className="px-5 flex flex-col gap-5 mt-3">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="relative active:scale-95 transition-transform">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="avatar" className="w-20 h-20 rounded-3xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-brand font-black text-3xl">
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                       style={{ background: "#4A27E8" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/>
                      <path d="M9 2L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9Zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
                    </svg>
                  </div>
                </button>
                <p className="text-xs" style={{ color: "var(--c-text3)" }}>Tap to change photo</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>

              <FieldInput label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
              <FieldInput label="Role / Title" value={role} onChange={setRole} placeholder="e.g. Co-founder, VP Engineering" />
              <FieldInput label="Company" value={company} onChange={setCompany} placeholder="e.g. Stripe, OpenAI, Independent" />

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text3)" }}>
                  Bio <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={280}
                  placeholder="What are you building or investing in?"
                  className="w-full px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ background: "var(--c-muted)", color: "var(--c-text1)", border: "1px solid var(--c-border)", ["--tw-ring-color" as string]: "#4A27E8" }}
                />
                <p className="text-xs text-right mt-1" style={{ color: "var(--c-text3)" }}>{bio.length}/280</p>
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--c-text3)" }}>
                  Interests <span className="normal-case font-normal">({interests.length}/5)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(({ id, label, icon }) => {
                    const selected = interests.includes(id);
                    const maxed    = interests.length >= 5 && !selected;
                    return (
                      <button key={id} type="button" onClick={() => toggleInterest(id)} disabled={maxed}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
                        style={{
                          background: selected ? "#4A27E8" : "var(--c-muted)",
                          color: selected ? "#fff" : "var(--c-text2)",
                          border: selected ? "1.5px solid #4A27E8" : "1.5px solid var(--c-border)",
                        }}>
                        <span>{icon}</span>{label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links section */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--c-text3)" }}>
                  Links
                </p>
                <div className="flex flex-col gap-3">
                  <FieldInput
                    label="LinkedIn"
                    value={linkedinUrl}
                    onChange={setLinkedinUrl}
                    placeholder="linkedin.com/in/yourname"
                    prefix="🔗"
                  />
                  <FieldInput
                    label="X / Twitter"
                    value={xHandle}
                    onChange={setXHandle}
                    placeholder="yourhandle"
                    prefix="@"
                  />
                  <FieldInput
                    label="Website"
                    value={websiteUrl}
                    onChange={setWebsiteUrl}
                    placeholder="yoursite.com"
                    prefix="🌐"
                  />
                  <FieldInput
                    label="Other"
                    value={otherUrl}
                    onChange={setOtherUrl}
                    placeholder="any other link"
                    prefix="🔗"
                  />
                </div>
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
        </div>,
        document.body
      )}
    </>
  );
}
