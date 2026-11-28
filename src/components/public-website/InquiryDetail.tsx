"use client";

import Link from "next/link";
import { ArrowRightIcon, ChatIcon, ClockIcon, MailIcon, RefreshIcon } from "@/components/icons";
import { Collapsible } from "@/components/ui/Collapsible";
import { ModalButton } from "@/components/ui/ModalButton";
import {
  addInquiryNoteAction,
  referInquiryAction,
  sendInquiryReplyAction,
  updateInquiryStatusAction,
} from "@/features/inquiries/actions";
import type { MailboxSyncStatus } from "@/features/mailbox-sync/types";
import type { Inquiry, InquiryStatus } from "@/features/inquiries/types";
import {
  INQUIRY_STATUS_LABELS,
  canReferInquiry,
  inquiryTypeLabel,
  isInquiryFinal,
  nextInquiryStatuses,
  type CuratorSettableInquiryStatus,
} from "@/features/inquiries/workflow";
import { formatTimestamp } from "@/features/public-submissions/format";
import type { CommunicationEntry } from "@/features/public-submissions/history";
import { publicWebsiteHref, type ReturnQuery } from "@/features/public-submissions/query";
import {
  ActionRow,
  EmailVisitorForm,
  HistoryTimeline,
  InfoRow,
  MessageThread,
  MessagesJumpLink,
  NoteForm,
  NotesList,
  StatusChangeForm,
  actionButtonClasses,
  actionButtonSecondaryClasses,
  managementColumnsClasses,
  messageCount,
  noteCount,
  panelClasses,
  primaryButtonClasses,
  type StatusOption,
} from "./DetailParts";
import { ReferralDialog } from "./ReferralDialog";
import { InquiryStatusBadge } from "./StatusBadge";

/** Anchor for the "Messages (N)" jump link; one inquiry is open at a time. */
const MESSAGES_ID = "inquiry-messages";

/** The Change status choices for an inquiry. Closing a Pending one also records the review step. */
function statusOption(status: CuratorSettableInquiryStatus, from: InquiryStatus): StatusOption {
  if (status === "REVIEWED") {
    return {
      value: "REVIEWED",
      label: "Reviewed",
      description: "You have read the inquiry and are following it up.",
    };
  }
  return {
    value: "CLOSED",
    label: "Closed",
    description:
      from === "PENDING"
        ? "The inquiry needs no further action. It is marked Reviewed and then Closed in one step, and stays in the archive and history."
        : "The inquiry needs no further action. It stays in the archive and history.",
    destructive: true,
  };
}

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
  const referAction = referInquiryAction.bind(
    null,
    inquiry.id,
    { phone: inquiry.phone === null, organization: inquiry.organization === null },
    returnQuery,
  );
  const canRefer = !isInquiryFinal(inquiry.status) && canReferInquiry(inquiry.status);
  const statusOptions: StatusOption[] = nextInquiryStatuses(inquiry.status).map((status) =>
    statusOption(status, inquiry.status),
  );
  // Listed with the statuses so every way to move the inquiry on is in one place. It opens the
  // referral form, which sets Turned to Visit Request when the visit request is created.
  if (canRefer) {
    statusOptions.push({
      value: "TURNED_TO_VISIT_REQUEST",
      label: "Turn into visit request",
      description:
        "Creates a visit request from this inquiry. Enter the visit details next; the inquiry changes only when the request is created.",
      action: (
        <ReferralDialog
          inquiry={inquiry}
          triggerClassName={primaryButtonClasses}
          triggerLabel="Enter the visit details"
          action={referAction}
        />
      ),
    });
  }
  const visitorMessage = { label: "Inquiry message", text: inquiry.message, receivedAt: inquiry.createdAt };

  return (
    <div className="space-y-4">
      <div className={managementColumnsClasses}>
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

          {/* Each action opens its form in a modal and asks for confirmation before it runs. */}
          <ActionRow>
            <ModalButton
              key={`reply-${inquiry.id}`}
              label={
                <>
                  <MailIcon className="h-4 w-4" />
                  Send Email
                </>
              }
              title="Reply by email"
              description="Sends your answer to the visitor. The inquiry's status does not change."
              className={actionButtonClasses}
            >
              <EmailVisitorForm
                action={sendInquiryReplyAction.bind(null, inquiry.id, returnQuery)}
                recipient={inquiry.email}
                placeholder="Answer the visitor's question here."
              />
            </ModalButton>

            {canRefer && (
              <ReferralDialog
                key={inquiry.id}
                inquiry={inquiry}
                triggerClassName={actionButtonClasses}
                action={referAction}
              />
            )}

            {!isInquiryFinal(inquiry.status) && statusOptions.length > 0 && (
              <ModalButton
                key={`status-${inquiry.id}-${inquiry.status}`}
                label={
                  <>
                    <RefreshIcon className="h-4 w-4" />
                    Change status
                  </>
                }
                title="Change status"
                description="Mark the inquiry Reviewed, close it, or turn it into a visit request."
                className={actionButtonSecondaryClasses}
              >
                <StatusChangeForm
                  action={updateInquiryStatusAction.bind(null, inquiry.id, returnQuery)}
                  options={statusOptions}
                />
              </ModalButton>
            )}

            <ModalButton
              key={`note-${inquiry.id}`}
              label={
                <>
                  <ChatIcon className="h-4 w-4" />
                  Add note
                </>
              }
              title="Add an internal note"
              description="For curators only. Record calls and other contact here; notes are never emailed."
              className={actionButtonSecondaryClasses}
            >
              <NoteForm action={addInquiryNoteAction.bind(null, inquiry.id, returnQuery)} />
            </ModalButton>
          </ActionRow>
        </section>

        <MessageThread
          id={MESSAGES_ID}
          visitorMessage={visitorMessage}
          entries={history}
          currentAccountId={currentAccountId}
        />
      </div>

      {/* Reference information stays collapsed until a curator asks for it. */}
      <Collapsible
        key={`notes-${inquiry.id}`}
        icon={ChatIcon}
        title="Notes"
        summary={`${noteCount(history)} ${noteCount(history) === 1 ? "note" : "notes"}`}
      >
        <NotesList entries={history} currentAccountId={currentAccountId} />
      </Collapsible>

      <Collapsible
        key={`history-${inquiry.id}`}
        icon={ClockIcon}
        title="History"
        summary="Status changes, emails and notes in order"
      >
        <p className="text-xs text-zinc-500">
          Visitor email replies appear here once they are imported from the museum mailbox.
        </p>
        <HistoryTimeline
          submittedAt={inquiry.createdAt}
          entries={history}
          statusLabels={INQUIRY_STATUS_LABELS}
          currentAccountId={currentAccountId}
          mailboxStatus={mailboxStatus}
        />
      </Collapsible>
    </div>
  );
}
