// Ảnh nền khuôn viên trung tâm (minh hoạ SVG) — dùng chung cho các màn tổng quan
// className: vị trí/kích thước, mặc định góc phải trên
export default function CampusBackdrop({ className = "pointer-events-none absolute right-0 top-0 h-[230px] w-[72%] max-w-[1100px]" }) {
  const trees = [40, 120, 210, 330, 470, 560, 690, 800, 905, 1010];
  return (
    <svg
      className={className}
      viewBox="0 0 1100 230"
      preserveAspectRatio="xMaxYMin slice"
      style={{
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 35%), linear-gradient(180deg, #000 55%, transparent 100%)",
        WebkitMaskComposite: "source-in",
        maskImage: "linear-gradient(90deg, transparent 0%, #000 35%), linear-gradient(180deg, #000 55%, transparent 100%)",
        maskComposite: "intersect",
        opacity: 0.55,
      }}
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bcd6f7" />
          <stop offset="1" stopColor="#e8f1fc" />
        </linearGradient>
      </defs>
      <rect width="1100" height="230" fill="url(#sky)" />
      <g fill="#f4f8fd" stroke="#9fbbe0" strokeWidth="1.2">
        <rect x="150" y="70" width="330" height="110" rx="4" />
        <rect x="560" y="55" width="300" height="125" rx="4" />
        <rect x="880" y="85" width="190" height="95" rx="4" />
        <path d="M140 72 L315 40 L490 72 Z" fill="#dbe7f7" />
        <path d="M550 57 L710 28 L870 57 Z" fill="#dbe7f7" />
      </g>
      <g fill="#a8c4e8">
        {Array.from({ length: 9 }).map((_, c) =>
          [88, 118, 148].map((y) => <rect key={`a${c}-${y}`} x={170 + c * 34} y={y} width="20" height="16" rx="2" />),
        )}
        {Array.from({ length: 8 }).map((_, c) =>
          [75, 105, 135].map((y) => <rect key={`b${c}-${y}`} x={580 + c * 34} y={y} width="20" height="18" rx="2" />),
        )}
        {Array.from({ length: 5 }).map((_, c) =>
          [100, 135].map((y) => <rect key={`c${c}-${y}`} x={898 + c * 34} y={y} width="20" height="16" rx="2" />),
        )}
      </g>
      {trees.map((x, i) => (
        <g key={x}>
          <rect x={x + 18} y={160} width="5" height="30" fill="#7c9a7a" />
          <circle cx={x + 20} cy={150 - (i % 3) * 6} r={24 + (i % 2) * 6} fill={i % 2 ? "#8fbf8d" : "#7fb27f"} opacity="0.9" />
        </g>
      ))}
      <rect y="186" width="1100" height="44" fill="#e3edf9" />
    </svg>
  );
}
