const DOTS = [
  { color: "#F73D8A", delay: "0s" },
  { color: "#F5B81C", delay: "0.18s" },
  { color: "#14D9A4", delay: "0.36s" },
];

export default function AppLoading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--background)", maxWidth: 430, margin: "0 auto" }}
    >
      <div className="flex gap-2.5">
        {DOTS.map((dot, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{
              background: dot.color,
              animationDelay: dot.delay,
              animationDuration: "0.9s",
              boxShadow: `0 3px 10px ${dot.color}70`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
