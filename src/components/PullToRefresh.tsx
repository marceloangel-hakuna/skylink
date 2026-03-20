"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 72; // px to trigger refresh

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef   = useRef(0);
  const [pullY,     setPullY]     = useState(0);   // 0–THRESHOLD
  const [phase,     setPhase]     = useState<"idle" | "pulling" | "releasing" | "refreshing">("idle");

  const progress = Math.min(pullY / THRESHOLD, 1);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;
    // Only start pull if already at the top of the scroll container
    const scrollEl = (el.closest(".page-scroll") as HTMLElement) ?? el;
    if (scrollEl.scrollTop > 2) return;
    startYRef.current = e.touches[0].clientY;
    setPhase("pulling");
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (phase !== "pulling") return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) { setPullY(0); return; }
    // Apply rubber-band resistance
    setPullY(Math.min(delta * 0.45, THRESHOLD * 1.1));
    if (delta > 8) e.preventDefault(); // prevent page scroll while pulling
  }, [phase]);

  const onTouchEnd = useCallback(() => {
    if (phase !== "pulling") return;
    if (pullY >= THRESHOLD * 0.9) {
      setPhase("refreshing");
      setPullY(THRESHOLD);
      router.refresh();
      setTimeout(() => {
        setPhase("idle");
        setPullY(0);
      }, 1200);
    } else {
      setPhase("releasing");
      setPullY(0);
      setTimeout(() => setPhase("idle"), 300);
    }
  }, [phase, pullY, router]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart",  onTouchStart, { passive: true });
    el.addEventListener("touchmove",   onTouchMove,  { passive: false });
    el.addEventListener("touchend",    onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener("touchstart",  onTouchStart);
      el.removeEventListener("touchmove",   onTouchMove);
      el.removeEventListener("touchend",    onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  // Centre indicator in the pulled gap, below the status-bar safe area.
  // pullY/2 puts it at the midpoint of the revealed space; −26 for half the indicator height.
  const indicatorY = pullY / 2 - 26;
  const isRefreshing = phase === "refreshing";

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator — sits inside the gap opened by the pulled content */}
      <div
        className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          transform: `translateY(${indicatorY}px)`,
          transition: phase === "pulling" ? "none" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          opacity: Math.max(0, progress * 1.5 - 0.1),
        }}
      >
        <div
          className="flex flex-col items-center gap-1 py-2"
        >
          {/* Plane icon */}
          <div
            style={{
              transform: `rotate(${isRefreshing ? 0 : -10 + progress * 10}deg)`,
              transition: isRefreshing ? "none" : "transform 0.1s",
              animation: isRefreshing ? "ptr-fly 0.7s ease-in-out infinite" : "none",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                fill="#4A27E8"
                fillOpacity={0.5 + progress * 0.5}
              />
            </svg>
          </div>
          {/* Trail dots */}
          <div className="flex gap-1" style={{ opacity: isRefreshing ? 1 : progress }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  background: "#4A27E8",
                  animation: isRefreshing ? `ptr-dot 0.7s ${i * 0.15}s ease-in-out infinite` : "none",
                  opacity: isRefreshing ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page content — pushed down when pulling */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: phase === "pulling" ? "none" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes ptr-fly {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-4px) rotate(5deg); }
        }
        @keyframes ptr-dot {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.5); }
        }
      `}</style>
    </div>
  );
}
