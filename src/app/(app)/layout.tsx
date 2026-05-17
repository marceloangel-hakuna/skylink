import AgentNav from "@/components/layout/AgentNav";
import UniversalAssistant from "@/components/UniversalAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* overflow-x clip is scoped here, NOT around AgentNav —
          prevents the Safari WebKit bug where overflow-x:clip + sticky
          inside overflow-y:auto causes position:fixed siblings to be
          positioned relative to this ancestor instead of the viewport. */}
      <div style={{ overflowX: "clip" }}>
        <main className="page-scroll">
          {children}
        </main>
      </div>
      <AgentNav />
      <UniversalAssistant />
    </>
  );
}
