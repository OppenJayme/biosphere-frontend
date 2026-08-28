export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="20" cy="20" r="18" />
      <path d="M28 12c-8 0-14 5-14 14 9 0 14-6 14-14Z" />
      <path d="M13 27c1.6-4.3 4.3-8 11-12.5" />
    </svg>
  );
}
