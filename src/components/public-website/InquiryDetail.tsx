"use client";

import Link from "next/link";
import { ArrowRightIcon, ChatIcon, DocumentTextIcon } from "@/components/icons";
import {
  addInquiryNoteAction,
  referInquiryAction,
  sendInquiryReplyAction,
  updateInquiryStatusAction,
} from "@/features/inquiries/actions";
import type { Inquiry } from "@/features/inquiries/types";
import {
  INQUIRY_STATUS_LABELS,
  canReferInquiry,
  inquiryTypeLabel,
  isInquiryFinal,
  nextInquiryStatuses,
} from "@/features/inquiries/workflow";
import { formatTimestamp } from "@/features/public-submissions/format";
import type { CommunicationEntry } from "@/features/public-submissions/history";
import { publicWebsiteHref, type ReturnQuery } from "@/features/public-submissions/query";
import {
  EmailVisitorForm,
  HistoryTimeline,
  InfoRow,
  NoteForm,
  PanelHeading,
  StatusChangeForm,
  panelClasses,
  type StatusOption,
} from "./DetailParts";
import { ReferralDialog } from "./ReferralDialog";
import { InquiryStatusBadge } from "./StatusBadge";

const STATUS_OPTIONS: Record<"REVIEWED" | "CLOSED", StatusOption> = {
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
    description: "You have read the inquiry and are following it up.",
  },
  CLOSED: {
    value: "CLOSED",
    label: "Closed",
    description: "The inquiry needs no further action. It stays in the archive and history.",
    destructive: true,
  },
};

export function InquiryDetail({
  inquiry,
  history,
  returnQuery,
  currentAccountId,
}: {
  inquiry: Inquiry;
  history: CommunicationEntry[] | null;
  returnQuery: ReturnQuery;
  currentAccountId: string | null;
}) {
  const statusOptions = nextInquiryStatuses(inquiry.status).map((status) => STATUS_OPTIONS[status]);

  return (
    <div className="space-y-4">
      <section aria-labelledby="inquiry-detail-heading" className={`${panelClasses} space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="inquiry-detail-heading" className="break-words text-base font-semibold text-zinc-900">
              {inquiry.name}
            </h2>
            <p className="text-xs text-zinc-500">
              Inquiry <span className="font-mono">{inquiry.referenceCode}</span> · {formatTimestamp(inquiry.createdAt)}
            </p>
          </div>
          <InquiryStatusBadge status={inquiry.status} />
        </div>

        <dl className="divide-y divide-black/5 border-y border-black/5">
          <InfoRow label="Email">{inquiry.email}</InfoRow>
          <InfoRow label="Contact number">{inquiry.phone ?? <span className="text-zinc-400">Not given</span>}</InfoRow>
          <InfoRow label="Organization">
            {inquiry.organization ?? <span className="text-zinc-400">Not given</span>}
          </InfoRow>
          <InfoRow label="Topic">{inquiryTypeLabel(inquiry.inquiryType)}</InfoRow>
          {inquiry.consentAcceptedAt && (
            <InfoRow label="Privacy consent">Accepted {formatTimestamp(inquiry.consentAcceptedAt)}</InfoRow>
          )}
        </dl>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <DocumentTextIcon className="h-3.5 w-3.5" />
            Message
          </p>
          <p className="whitespace-pre-line break-words rounded-lg bg-sage-50 px-3 py-2.5 text-sm text-zinc-800">
            {inquiry.message}
          </p>
        </div>

        {inquiry.visitRequestId && (
          <Link
            href={publicWebsiteHref({ tab: "visits" }, { selected: inquiry.visitRequestId })}
            className="flex items-center justify-between rounded-lg border border-forest-600/40 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-100"
          >
            Open the visit request made from this inquiry
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </section>

      {!isInquiryFinal(inquiry.status) && (
        <>
          {statusOptions.length > 0 && (
            <StatusChangeForm
              key={`${inquiry.id}-${inquiry.status}`}
              action={updateInquiryStatusAction.bind(null, inquiry.id, returnQuery)}
              options={statusOptions}
              recordLabel="inquiry"
            />
          )}
          {canReferInquiry(inquiry.status) && (
            <section className={`${panelClasses} space-y-3`}>
              <PanelHeading
                icon={ArrowRightIcon}
                title="Visit request"
                description="If the visitor wants to come to the museum, turn this inquiry into a visit request."
              />
              <ReferralDialog
                key={inquiry.id}
                inquiry={inquiry}
                action={referInquiryAction.bind(
                  null,
                  inquiry.id,
                  { phone: inquiry.phone === null, organization: inquiry.organization === null },
                  returnQuery,
                )}
              />
            </section>
          )}
        </>
      )}

      <EmailVisitorForm
        key={`reply-${inquiry.id}`}
        action={sendInquiryReplyAction.bind(null, inquiry.id, returnQuery)}
        recipient={inquiry.email}
        title="Reply by email"
        description="Sends your answer to the visitor. The inquiry's status does not change."
        placeholder="Answer the visitor's question here."
      />

      <section className={`${panelClasses} space-y-4`}>
        <PanelHeading
          icon={ChatIcon}
          title="Notes and history"
          description="Replies the visitor sends to the museum's mailbox are not imported. Record what matters as a note."
        />
        <NoteForm key={inquiry.id} action={addInquiryNoteAction.bind(null, inquiry.id, returnQuery)} />
        <HistoryTimeline
          submittedAt={inquiry.createdAt}
          entries={history}
          statusLabels={INQUIRY_STATUS_LABELS}
          currentAccountId={currentAccountId}
        />
      </section>
    </div>
  );
}
