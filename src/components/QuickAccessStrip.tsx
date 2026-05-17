"use client";

type Sheet = "flights" | "people" | "chat" | "rewards" | "notifications";

const ITEMS: { label: string; sheet: Sheet }[] = [
  { label: "Flights",       sheet: "flights" },
  { label: "People",        sheet: "people" },
  { label: "Chat",          sheet: "chat" },
  { label: "Rewards",       sheet: "rewards" },
  { label: "Notifications", sheet: "notifications" },
];

export default function QuickAccessStrip() {
  function open(sheet: Sheet) {
    window.dispatchEvent(new CustomEvent("openSheet", { detail: { sheet } }));
  }

  return (
    <div className="flex items-center gap-1.5 px-4 pb-5 overflow-x-auto no-scrollbar">
      {ITEMS.map(({ label, sheet }) => (
        <button
          key={sheet}
          onClick={() => open(sheet)}
          className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full active:opacity-60 transition-opacity"
          style={{ background: "var(--c-muted)", color: "var(--c-text3)", border: "1px solid var(--c-border)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
