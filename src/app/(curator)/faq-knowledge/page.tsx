/** Protected browser for curator-controlled FAQ knowledge. */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { FaqKnowledgeWorkspace } from "@/components/faq/FaqKnowledgeWorkspace";
import { listFaqEntries } from "@/features/faq/api";
import { faqKnowledgeHref, parseFaqListQuery } from "@/features/faq/query";
import type { FaqEntryPage } from "@/features/faq/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { PageHeader, PAGE_ACTION_SECONDARY } from "@/components/curator/PageHeader";

export const metadata: Metadata = { title: "FAQ Knowledge" };

type FaqKnowledgePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const notices: Record<string, string> = {
  created: "The FAQ knowledge entry was created as inactive.",
  updated: "The FAQ knowledge content was updated.",
  activated: "The FAQ knowledge entry was activated.",
  deactivated: "The FAQ knowledge entry was deactivated.",
  archived: "The FAQ knowledge entry was archived.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FaqKnowledgePage({ searchParams }: FaqKnowledgePageProps) {
  if (!(await verifySession())) redirect("/login?from=/faq-knowledge");

  const params = await searchParams;
  const query = parseFaqListQuery(params);
  const selectedResult = z.uuid().safeParse(firstValue(params.selected));
  const notice = notices[firstValue(params.notice) ?? ""];
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
      <PageHeader
        title="FAQ Knowledge"
        description="Approved questions and answers. The public FAQ assistant only answers from this list."
        info="Only active answers are used. Visitors are matched on the question, its other wordings and keywords; anything that doesn't match is sent to the General Inquiry form."
        actions={
          <Link href="/faq-knowledge/review" className={PAGE_ACTION_SECONDARY}>
            Review unanswered questions
          </Link>
        }
      />

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}

      <FaqKnowledgeWorkspace
        key={selectedResult.success ? selectedResult.data : faqKnowledgeHref(query)}
        page={page}
        query={query}
        errorMessage={errorMessage}
        initialSelectedId={selectedResult.success ? selectedResult.data : undefined}
      />
    </div>
  );
}
