import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="page-scroll" style={{ position: "relative" }}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
