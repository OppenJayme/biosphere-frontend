import Link from "next/link";
import { redirect } from "next/navigation";
import { FaqReviewItem } from "@/components/faq/FaqReviewItem";
import { listReviewQuestions } from "@/features/faq/review-api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata = { title: "FAQ question review" };
export default async function FaqReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await verifySession())) redirect("/login?from=/faq-knowledge/review");
  const params = await searchParams;
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  const requested = Number(raw ?? 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  let queue: Awaited<ReturnType<typeof listReviewQuestions>> | null = null;
  let errorMessage = "";
  try { queue = await listReviewQuestions(page); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?from=/faq-knowledge/review");
    errorMessage = error instanceof ApiError && error.status === 403 ? "You do not have permission to review visitor questions."
      : "Question review is disabled or temporarily unavailable. No review data is shown.";
  }
  return <div className="space-y-5">
    <header className="space-y-2"><h1 className="font-serif text-2xl font-semibold text-forest-800">Opt-in question review</h1>
      <p className="text-sm text-zinc-600">Untrusted visitor text: it may contain personal information. Remove accidental personal data promptly. Repeat counts represent opt-in submissions, not distinct visitors.</p>
      <p className="text-sm text-zinc-600">Review access expires 30 days after the first grouped submission. Marking reviewed or dismissed does not delete the text, publish an FAQ or reply to a visitor. Use FAQ Knowledge separately for approved content.</p>
      <Link href="/faq-knowledge" className="text-sm text-forest-700 underline">Back to FAQ Knowledge</Link>
    </header>
    {errorMessage && <div role="alert" className="rounded border border-amber-200 p-4">{errorMessage}<a href={`/faq-knowledge/review?page=${page}`} className="ml-2 underline">Try again</a></div>}
    {queue && <>
      {queue.items.length === 0 && <p>No unexpired review items on this page.</p>}
      {queue.items.map(item => <FaqReviewItem key={`${item.id}-${item.status}`} item={item} />)}
      <nav aria-label="Question review pages" className="flex gap-4 text-sm">
        {page > 1 && <Link href={`/faq-knowledge/review?page=${page - 1}`}>Previous</Link>}
        <span>Page {page}</span>
        {queue.hasMore && <Link href={`/faq-knowledge/review?page=${page + 1}`}>Next</Link>}
      </nav>
    </>}
  </div>;
}
