export default function AppLoading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--background)", maxWidth: 430, margin: "0 auto" }}
    >
      {/* Radar rings */}
      <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
        {/* Outer ring */}
        <div
          className="absolute rounded-full border"
          style={{
            width: 72, height: 72,
            borderColor: "rgba(124,106,245,0.15)",
            animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
          }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full border"
          style={{
            width: 48, height: 48,
            borderColor: "rgba(124,106,245,0.25)",
            animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite 0.4s",
          }}
        />
        {/* Core */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{ width: 28, height: 28, background: "rgba(124,106,245,0.15)", border: "1.5px solid rgba(124,106,245,0.5)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#7C6AF5">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
          </svg>
        </div>
      </div>
      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--c-text3)", letterSpacing: "0.15em" }}>
        SkyLink
      </p>
    </div>
  );
}
