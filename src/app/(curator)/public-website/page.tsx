/** Curator workspace for public General Inquiries (SRS 4.8) and Visit Requests (SRS 4.9). */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/StatCard";
import {
  PublicWebsiteWorkspace,
  type SubmissionSelection,
} from "@/components/public-website/PublicWebsiteWorkspace";
import type { SubmissionRows } from "@/components/public-website/SubmissionTable";
import { getInquiry, getInquiryHistory, listInquiries } from "@/features/inquiries/api";
import type { Inquiry } from "@/features/inquiries/types";
import {
  PUBLIC_WEBSITE_PATH,
  parsePublicWebsiteQuery,
  parseSelectedId,
} from "@/features/public-submissions/query";
import {
  getCampusEntrySummary,
  getVisitRequest,
  getVisitRequestHistory,
  listVisitRequests,
} from "@/features/visit-requests/api";
import type { VisitRequest } from "@/features/visit-requests/types";
import { isUpcomingVisit } from "@/features/visit-requests/workflow";
import { ApiError } from "@/lib/api-client";
import { getAccountInfo, verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Public Website",
};

type PublicWebsitePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NOTICES: Record<string, string> = {
  "inquiry-reviewed": "The inquiry was marked as reviewed.",
  "inquiry-closed": "The inquiry was closed.",
  referred: "A pending visit request was created from the inquiry. Approve a schedule when you are ready.",
  "note-added": "The note was added to the history.",
  "visit-approved": "The schedule was approved. Copy the campus-entry summary into the USC campus-entry process.",
  "visit-submitted": "The visit request was marked as submitted for campus entry.",
  "visit-completed": "The visit was marked as completed.",
  "visit-declined": "The visit request was declined.",
  "visit-cancelled": "The visit request was cancelled.",
  email: "",
};

/** What happened to the email an action triggered. Never report a failed send as delivered. */
const EMAIL_NOTICES: Record<string, { text: string; ok: boolean }> = {
  sent: { text: "The visitor was emailed.", ok: true },
  failed: {
    text: "The email to the visitor failed to send. Nothing else was undone. See the history for the reason, then send a message to try again.",
    ok: false,
  },
  "not-sent": {
    text: "No email was sent because email is not set up on the server. Nothing else was undone; contact the visitor another way.",
    ok: false,
  },
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUnauthorized(result: PromiseSettledResult<unknown>) {
  return result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 401;
}

function loadErrorMessage(error: unknown, what: string) {
  if (error instanceof ApiError && error.status === 403) {
    return `Your account does not have permission to view ${what}. Only curators can.`;
  }
  return `${what.charAt(0).toUpperCase()}${what.slice(1)} are temporarily unavailable. Check the backend connection and try again.`;
}

/** Settles to null instead of throwing, so one failed side request (history, summary) doesn't blank the page. */
async function optional<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
    return null;
  }
}

async function loadSelection(
  kind: "inquiry" | "visit",
  id: string,
  known: Inquiry | VisitRequest | undefined,
): Promise<{ selection: SubmissionSelection | null; error?: string }> {
  try {
    if (kind === "inquiry") {
      const [record, history] = await Promise.all([
        known ? Promise.resolve(known as Inquiry) : getInquiry(id),
        optional(getInquiryHistory(id)),
      ]);
      return { selection: { kind, record, history } };
    }

    const [record, history] = await Promise.all([
      known ? Promise.resolve(known as VisitRequest) : getVisitRequest(id),
      optional(getVisitRequestHistory(id)),
    ]);
    // The summary exists only once a schedule is approved.
    const campusEntry = record.approvedSchedule ? await optional(getCampusEntrySummary(id)) : null;
    return { selection: { kind, record, history, campusEntry } };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
    const what = kind === "inquiry" ? "inquiry" : "visit request";
    return {
      selection: null,
      error:
        error instanceof ApiError && (error.status === 404 || error.status === 400)
          ? `This ${what} no longer exists. Choose another from the list.`
          : `The ${what} could not be loaded. Check the backend connection and try again.`,
    };
  }
}

export default async function PublicWebsitePage({ searchParams }: PublicWebsitePageProps) {
  if (!(await verifySession())) redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);

  const params = await searchParams;
  const query = parsePublicWebsiteQuery(params);
  const selectedId = parseSelectedId(params);
  const noticeKey = firstValue(params.notice) ?? "";
  const notice = noticeKey in NOTICES ? NOTICES[noticeKey] : undefined;
  const emailNotice = notice !== undefined ? EMAIL_NOTICES[firstValue(params.email) ?? ""] : undefined;
  const filtered = Boolean(query.status || query.search);

  // Unfiltered lists feed the stats and tab counts; the backend has no pagination for these yet.
  const [inquiriesResult, visitsResult, filteredResult] = await Promise.allSettled([
    listInquiries(),
    listVisitRequests(),
    filtered
      ? query.tab === "inquiries"
        ? listInquiries({ status: query.status || undefined, search: query.search || undefined })
        : listVisitRequests({ status: query.status || undefined, search: query.search || undefined })
      : Promise.resolve(null),
  ]);

  if ([inquiriesResult, visitsResult, filteredResult].some(isUnauthorized)) {
    redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
  }

  const inquiries = inquiriesResult.status === "fulfilled" ? inquiriesResult.value : null;
  const visits = visitsResult.status === "fulfilled" ? visitsResult.value : null;

  let rows: SubmissionRows | null = null;
  let listError: string | undefined;
  const tabResult = filtered ? filteredResult : query.tab === "inquiries" ? inquiriesResult : visitsResult;
  if (tabResult.status === "rejected") {
    listError = loadErrorMessage(tabResult.reason, query.tab === "inquiries" ? "inquiries" : "visit requests");
  } else if (query.tab === "inquiries") {
    rows = { kind: "inquiry", items: (tabResult.value as Inquiry[] | null) ?? [] };
  } else {
    rows = { kind: "visit", items: (tabResult.value as VisitRequest[] | null) ?? [] };
  }

  const kind = query.tab === "inquiries" ? "inquiry" : "visit";
  const targetId = selectedId ?? rows?.items[0]?.id;
  const known =
    targetId === undefined
      ? undefined
      : kind === "inquiry"
        ? inquiries?.find((item) => item.id === targetId)
        : visits?.find((item) => item.id === targetId);
  const { selection, error: selectionError } = targetId
    ? await loadSelection(kind, targetId, known)
    : { selection: null, error: undefined };

  const pendingInquiries = inquiries?.filter((item) => item.status === "PENDING").length ?? null;
  const pendingVisits = visits?.filter((item) => item.status === "PENDING").length ?? null;
  const upcomingVisits = visits?.filter((item) => isUpcomingVisit(item)).length ?? null;
  const unavailable = "—";

  const account = await getAccountInfo();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Public Website</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review general inquiries and visit requests submitted through the public website.
        </p>
      </div>

      {notice !== undefined && (notice || emailNotice) && (
        <div
          role={emailNotice && !emailNotice.ok ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            emailNotice && !emailNotice.ok
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {[notice, emailNotice?.text].filter(Boolean).join(" ")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Inquiries"
          value={inquiries ? inquiries.length.toLocaleString() : unavailable}
          note={inquiries ? "All general inquiries on record" : "Could not load"}
          tone="neutral"
          icon="log"
        />
        <StatCard
          label="Pending Inquiries"
          value={pendingInquiries?.toLocaleString() ?? unavailable}
          note="Waiting for a curator to review"
          tone={pendingInquiries ? "warning" : "positive"}
          icon="clock"
        />
        <StatCard
          label="Pending Visit Requests"
          value={pendingVisits?.toLocaleString() ?? unavailable}
          note="Waiting for a schedule approval"
          tone={pendingVisits ? "warning" : "positive"}
          icon="calendar"
        />
        <StatCard
          label="Upcoming Visits"
          value={upcomingVisits?.toLocaleString() ?? unavailable}
          note="Approved, from today onward"
          tone="positive"
          icon="shield"
        />
      </div>

      <PublicWebsiteWorkspace
        key={`${query.tab}|${query.status}|${query.search}`}
        query={query}
        rows={rows}
        listError={listError}
        selection={selection}
        selectionError={selectionError}
        pendingInquiries={pendingInquiries}
        pendingVisits={pendingVisits}
        currentAccountId={account?.accountId ?? null}
      />
    </div>
  );
}
