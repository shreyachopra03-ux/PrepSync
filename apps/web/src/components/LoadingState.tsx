interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-gray-500">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"
      />
      <span>{message}</span>
    </div>
  );
}
