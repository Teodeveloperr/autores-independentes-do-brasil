export default function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="instagram-icon-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="35%" stopColor="#FF543E" />
          <stop offset="70%" stopColor="#C837AB" />
          <stop offset="100%" stopColor="#5B51D8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#instagram-icon-gradient)" />
      <rect x="14" y="14" width="20" height="20" rx="6" fill="none" stroke="white" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="6" fill="none" stroke="white" strokeWidth="2.5" />
      <circle cx="31.5" cy="16.5" r="1.8" fill="white" />
    </svg>
  );
}
