import { btnSmall } from "./ds/styles";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-md border border-[#8A2626]/50 bg-[#FCE9E2] px-4 py-3 text-sm leading-relaxed text-[#6E1F1F]"
    >
      <span className="break-words">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${btnSmall} shrink-0`}>
          Retry
        </button>
      )}
    </div>
  );
}
