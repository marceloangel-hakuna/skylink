export default function AppLoading() {
  const dots = [
    { color: "#F73D8A", delay: "0s" },     // brand pink
    { color: "#F5B81C", delay: "0.18s" },  // brand amber/yellow
    { color: "#14D9A4", delay: "0.36s" },  // brand teal/green
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--background)", maxWidth: 430, margin: "0 auto" }}
    >
      {/* App icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-512.png"
        alt="SkyLink"
        className="w-24 h-24 rounded-3xl shadow-2xl"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
      />

      {/* Brand name */}
      <div className="flex flex-col items-center gap-1">
        <p
          className="text-4xl font-black uppercase"
          style={{ letterSpacing: "0.18em", color: "var(--c-text1)" }}
        >
          SKYLINK
        </p>
        <p className="text-xs font-medium tracking-wider" style={{ color: "var(--c-text3)" }}>
          Network at 35,000 ft
        </p>
      </div>

      {/* Brand-colored bouncing dots */}
      <div className="flex gap-3 mt-2">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full animate-bounce"
            style={{
              background: dot.color,
              animationDelay: dot.delay,
              animationDuration: "0.9s",
              boxShadow: `0 4px 12px ${dot.color}80`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
