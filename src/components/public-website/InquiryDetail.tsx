"use client";

import Link from "next/link";
import { ArrowRightIcon, ChatIcon } from "@/components/icons";
import {
  addInquiryNoteAction,
  referInquiryAction,
  sendInquiryReplyAction,
  updateInquiryStatusAction,
} from "@/features/inquiries/actions";
import type { MailboxSyncStatus } from "@/features/mailbox-sync/types";
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
  MessageThread,
  MessagesJumpLink,
  NoteForm,
  PanelHeading,
  StatusChangeForm,
  managementColumnClasses,
  managementColumnsClasses,
  messageCount,
  panelClasses,
  type StatusOption,
} from "./DetailParts";
import { ReferralDialog } from "./ReferralDialog";
import { InquiryStatusBadge } from "./StatusBadge";

/** Anchor for the "Messages (N)" jump link; one inquiry is open at a time. */
const MESSAGES_ID = "inquiry-messages";

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
  mailboxStatus,
}: {
  inquiry: Inquiry;
  history: CommunicationEntry[] | null;
  returnQuery: ReturnQuery;
  currentAccountId: string | null;
  mailboxStatus: MailboxSyncStatus | null;
}) {
  const statusOptions = nextInquiryStatuses(inquiry.status).map((status) => STATUS_OPTIONS[status]);
  const visitorMessage = { label: "Inquiry message", text: inquiry.message, receivedAt: inquiry.createdAt };

  return (
    <div className={managementColumnsClasses}>
      <div className={managementColumnClasses}>
        <section aria-labelledby="inquiry-detail-heading" className={`${panelClasses} space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="inquiry-detail-heading" className="break-words text-base font-semibold text-zinc-900">
                {inquiry.name}
              </h3>
              <p className="text-xs text-zinc-500">
                General inquiry · received {formatTimestamp(inquiry.createdAt)}
              </p>
            </div>
            <InquiryStatusBadge status={inquiry.status} />
          </div>
          <MessagesJumpLink targetId={MESSAGES_ID} count={messageCount(visitorMessage, history)} />

          <dl className="divide-y divide-black/5 border-y border-black/5">
            {/* The visitor's own reference number, quoted in emails and follow-ups. */}
            <InfoRow label="Reference no.">{inquiry.referenceCode}</InfoRow>
            <InfoRow label="Email">{inquiry.email}</InfoRow>
            <InfoRow label="Contact number">{inquiry.phone ?? <span className="text-zinc-400">Not given</span>}</InfoRow>
            <InfoRow label="Organization">
              {inquiry.organization ?? <span className="text-zinc-400">Not given</span>}
            </InfoRow>
            <InfoRow label="Topic">{inquiryTypeLabel(inquiry.inquiryType)}</InfoRow>
            {inquiry.visitReferenceCode && (
              <InfoRow label="Visit request ref.">
                {/* Searches the visit requests by the reference number the visitor quoted. */}
                <Link
                  href={publicWebsiteHref({ tab: "visits", search: inquiry.visitReferenceCode })}
                  className="font-mono font-semibold text-forest-800 underline-offset-2 hover:underline"
                >
                  {inquiry.visitReferenceCode}
                </Link>
              </InfoRow>
            )}
            {inquiry.consentAcceptedAt && (
              <InfoRow label="Privacy consent">Accepted {formatTimestamp(inquiry.consentAcceptedAt)}</InfoRow>
            )}
          </dl>

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

        <MessageThread
          id={MESSAGES_ID}
          visitorMessage={visitorMessage}
          entries={history}
          currentAccountId={currentAccountId}
        />

        <section className={`${panelClasses} space-y-4`}>
          <PanelHeading
            icon={ChatIcon}
            title="Notes and history"
            description="Visitor email replies appear here once they are imported from the museum mailbox. Record calls and other contact as a note."
          />
          <NoteForm key={inquiry.id} action={addInquiryNoteAction.bind(null, inquiry.id, returnQuery)} />
          <HistoryTimeline
            submittedAt={inquiry.createdAt}
            entries={history}
            statusLabels={INQUIRY_STATUS_LABELS}
            currentAccountId={currentAccountId}
            mailboxStatus={mailboxStatus}
          />
        </section>
      </div>

      <div className={managementColumnClasses}>
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
      </div>
    </div>
  );
}
