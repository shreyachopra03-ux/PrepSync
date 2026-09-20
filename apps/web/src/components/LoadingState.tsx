import { Spinner } from "./ds";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-ink-soft">
      <Spinner />
      <span className="font-mono text-xs uppercase tracking-[0.14em]">{message}</span>
    </div>
  );
}
