export default function NewsroomArticleLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 h-4 w-40 animate-pulse rounded bg-neutral-100" />
      <div className="mb-8 aspect-[16/9] w-full animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-10 w-4/5 max-w-2xl animate-pulse rounded bg-neutral-200" />
      <div className="mt-6 h-24 w-full animate-pulse rounded-lg bg-neutral-50" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
      </div>
    </article>
  );
}
