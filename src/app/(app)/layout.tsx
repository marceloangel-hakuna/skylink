import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="page-scroll pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
