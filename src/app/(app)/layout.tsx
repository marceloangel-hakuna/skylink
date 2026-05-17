import UniversalAssistant from "@/components/UniversalAssistant";
import SheetHost from "@/components/SheetHost";
import BackNav from "@/components/BackNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* overflow-x clip scoped here to avoid the Safari WebKit bug where
          overflow-x:clip + sticky inside overflow-y:auto causes fixed
          siblings to position relative to this ancestor instead of viewport. */}
      <div style={{ overflowX: "clip" }}>
        <main className="page-scroll">
          {children}
        </main>
      </div>
      <BackNav />
      <UniversalAssistant />
      <SheetHost />
    </>
  );
}
