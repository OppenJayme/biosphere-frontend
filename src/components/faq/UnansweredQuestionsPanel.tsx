/** Curator review list of public assistant questions that had no approved answer. */

import { reviewUnansweredQuestionAction } from "@/features/faq/actions";
import type { UnansweredQuestionPage } from "@/features/faq/unanswered";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function UnansweredQuestionsPanel({
  page,
  errorMessage,
}: {
  page: UnansweredQuestionPage | null;
  errorMessage?: string;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4" aria-labelledby="unanswered-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="unanswered-heading" className="text-sm font-semibold text-zinc-900">
            Unanswered visitor questions
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Questions the public assistant could not answer or had to clarify, grouped by wording. Add or improve an FAQ
            entry, then mark the question reviewed. Only the question text is kept, for{" "}
            {page?.retentionDays ?? 90} days.
          </p>
        </div>
        {page && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {page.total} open
          </span>
        )}
      </div>

      {errorMessage && <p className="mt-3 text-sm text-red-700">{errorMessage}</p>}

      {page && page.items.length === 0 && (
        <p className="mt-3 text-sm text-zinc-500">No unanswered questions are waiting for review.</p>
      )}

      {page && page.items.length > 0 && (
        <ul className="mt-3 divide-y divide-black/5">
          {page.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">“{item.question}”</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Asked {item.timesAsked} time{item.timesAsked === 1 ? "" : "s"} · last {formatDate(item.lastAskedAt)} ·{" "}
                  {item.outcome === "CLARIFY" ? "visitor was asked to clarify" : "no approved answer"}
                </p>
              </div>
              <form action={reviewUnansweredQuestionAction}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium text-forest-800 hover:bg-sage-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                >
                  Mark reviewed
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
