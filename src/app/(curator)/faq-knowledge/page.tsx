/** Protected browser for curator-controlled FAQ knowledge. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FaqKnowledgeWorkspace } from "@/components/faq/FaqKnowledgeWorkspace";
import { listFaqEntries } from "@/features/faq/api";
import { faqKnowledgeHref, parseFaqListQuery } from "@/features/faq/query";
import type { FaqEntryPage } from "@/features/faq/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = { title: "FAQ Knowledge" };

type FaqKnowledgePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FaqKnowledgePage({ searchParams }: FaqKnowledgePageProps) {
  if (!(await verifySession())) redirect("/login?from=/faq-knowledge");

  const query = parseFaqListQuery(await searchParams);
  let page: FaqEntryPage | null = null;
  let errorMessage: string | undefined;

  try {
    page = await listFaqEntries(query);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?from=/faq-knowledge");
    }
    errorMessage =
      error instanceof ApiError && error.status === 403
        ? "Your active account does not have permission to review FAQ knowledge."
        : "FAQ knowledge is temporarily unavailable. Check the backend connection and try again.";
  }

  if (page) {
    const lastPage = Math.max(1, Math.ceil(page.total / page.limit));
    if (query.page > lastPage) redirect(faqKnowledgeHref(query, lastPage));
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Controlled knowledge</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">FAQ Knowledge</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review curator-approved questions and answers without generating unsupported responses.
        </p>
      </header>

      <FaqKnowledgeWorkspace page={page} query={query} errorMessage={errorMessage} />
    </div>
  );
}
