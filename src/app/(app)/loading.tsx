export default function AppLoading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--background)", maxWidth: 430, margin: "0 auto" }}
    >
      {/* Logo */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glass"
        style={{ background: "linear-gradient(135deg, #3418C8 0%, #4A27E8 60%, #6B4AF0 100%)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-lg font-black" style={{ color: "var(--c-text1)" }}>SkyLink</p>
        <p className="text-xs" style={{ color: "var(--c-text3)" }}>Network at 35,000 ft</p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background: "#4A27E8",
              animationDelay: `${i * 0.25}s`,
              animationDuration: "1s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
