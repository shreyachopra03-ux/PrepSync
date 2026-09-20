export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect x="2" y="2" width="15" height="17" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="9" y="7" width="15" height="17" rx="2.5" fill="#E4F169" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13 13h7M13 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        prep<em className="font-semibold italic">sync</em>
      </span>
    </span>
  );
}
