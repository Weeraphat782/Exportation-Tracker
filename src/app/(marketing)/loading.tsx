export default function MarketingLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-white px-6 py-16">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-500"
        aria-hidden
      />
      <p className="text-sm text-neutral-500">Loading…</p>
    </div>
  );
}
