export default function ResourceArticleLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 h-4 w-44 animate-pulse rounded bg-neutral-100" />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-100" />
      </div>
      <div className="mt-8 aspect-[16/9] w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="mt-6 h-10 w-4/5 animate-pulse rounded bg-neutral-200" />
      <div className="mt-6 h-20 w-full animate-pulse rounded-lg bg-neutral-50" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
      </div>
    </article>
  );
}
