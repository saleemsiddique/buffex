export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-[var(--highlight)]/20 rounded-full" />
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-[var(--highlight)] rounded-full animate-spin" />
      </div>
    </div>
  );
}
