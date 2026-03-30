export default function NewsroomLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 h-20 w-full max-w-2xl animate-pulse rounded bg-neutral-100" />
      <div className="mt-10 aspect-[21/9] w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="mt-10 space-y-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 overflow-hidden rounded-lg border border-neutral-100 md:flex-row"
          >
            <div className="h-48 w-full shrink-0 animate-pulse bg-neutral-100 md:w-64" />
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-100" />
              <div className="h-16 w-full animate-pulse rounded bg-neutral-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
