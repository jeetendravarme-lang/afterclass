// Instagram logo (official-style gradient glyph) as inline SVG.
// Drawn from the brand mark: rounded square, camera outline, lens dot.
export default function InstagramIcon({
  size = 20,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Instagram"
    >
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#feda75" />
          <stop offset="0.25" stopColor="#fa7e1e" />
          <stop offset="0.5" stopColor="#d62976" />
          <stop offset="0.75" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6.5" fill="url(#ig-grad)" />
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="#fff" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="4.1" stroke="#fff" strokeWidth="1.8" fill="none" />
      <circle cx="17.4" cy="6.6" r="1.4" fill="#fff" />
    </svg>
  );
}
