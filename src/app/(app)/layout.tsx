import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* overflow-x clip is scoped here, NOT around BottomNav —
          prevents the Safari WebKit bug where overflow-x:clip + sticky
          inside overflow-y:auto causes position:fixed siblings to be
          positioned relative to this ancestor instead of the viewport. */}
      <div style={{ overflowX: "clip" }}>
        <main className="page-scroll">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
