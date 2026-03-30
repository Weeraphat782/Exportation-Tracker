export default function ResourcesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 h-10 w-56 max-w-full animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 h-16 w-full max-w-2xl animate-pulse rounded bg-neutral-100" />
      <div className="mt-10 aspect-[3/1] w-full animate-pulse rounded-lg bg-neutral-100" />
      <div className="mt-10 space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-neutral-100 lg:flex"
          >
            <div className="h-48 w-full shrink-0 animate-pulse bg-neutral-100 lg:w-48" />
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
              <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-100" />
              <div className="h-12 w-full animate-pulse rounded bg-neutral-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
