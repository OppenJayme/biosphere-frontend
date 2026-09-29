"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRightIcon, CalendarIcon, CarIcon, ChatIcon, CheckIcon, ClipboardIcon, UsersIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { formatTimestamp } from "@/features/public-submissions/format";
import type { CommunicationEntry } from "@/features/public-submissions/history";
import { publicWebsiteHref, type ReturnQuery } from "@/features/public-submissions/query";
import { formatSchedule, museumToday } from "@/features/public-submissions/schedule";
import {
  addVisitNoteAction,
  approveVisitScheduleAction,
  sendVisitMessageAction,
  updateVisitStatusAction,
} from "@/features/visit-requests/actions";
import type { CampusEntrySummary, VisitRequest } from "@/features/visit-requests/types";
import {
  VISIT_REQUEST_STATUS_LABELS,
  canApproveSchedule,
  emailsVisitorOnStatus,
  isDestructiveVisitStatus,
  nextVisitStatuses,
  type CuratorSettableVisitStatus,
} from "@/features/visit-requests/workflow";
import {
  ActionError,
  DecisionNote,
  EmailVisitorForm,
  HistoryTimeline,
  InfoRow,
  NoteForm,
  PanelHeading,
  StatusChangeForm,
  VisitorEmailFields,
  panelClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  type NoteAction,
  type StatusOption,
} from "./DetailParts";
import { VisitStatusBadge } from "./StatusBadge";

const STATUS_DESCRIPTIONS: Record<CuratorSettableVisitStatus, string> = {
  SUBMITTED_FOR_CAMPUS_ENTRY: "You have sent the campus-entry summary through the USC campus-entry process.",
  COMPLETED: "The visit took place.",
  DECLINED: "The museum cannot accommodate this request.",
  CANCELLED: "The visitor or the museum called off the visit.",
};

function statusOption(status: CuratorSettableVisitStatus): StatusOption {
  return {
    value: status,
    label: VISIT_REQUEST_STATUS_LABELS[status],
    description: STATUS_DESCRIPTIONS[status],
    destructive: isDestructiveVisitStatus(status),
  };
}

function NotGiven() {
  return <span className="text-zinc-400">Not given</span>;
}

function ApproveScheduleForm({ request, action }: { request: VisitRequest; action: NoteAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const today = museumToday();
  const firstOpen = request.preferredSchedules.find((schedule) => schedule.date >= today);
  const [choice, setChoice] = useState<number | null>(firstOpen?.preferenceOrder ?? null);
  const [notify, setNotify] = useState(state.notifyVisitor ?? true);
  const chosen = request.preferredSchedules.find((schedule) => schedule.preferenceOrder === choice);

  return (
    <form action={formAction} className={`${panelClasses} space-y-3`}>
      <PanelHeading
        icon={CalendarIcon}
        title="Approve a schedule"
        description="Approving one option sets the request to Approved by Curator. The other options stay on record."
      />
      <fieldset className="space-y-2">
        <legend className="sr-only">Preferred schedules</legend>
        {request.preferredSchedules.map((schedule) => {
          const past = schedule.date < today;
          return (
            <label
              key={schedule.preferenceOrder}
              className={`flex gap-2.5 rounded-lg border border-black/10 px-3 py-2 text-xs has-checked:border-forest-700 has-checked:bg-forest-50 ${
                past ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="preferenceOrder"
                value={schedule.preferenceOrder}
                disabled={past}
                checked={choice === schedule.preferenceOrder}
                onChange={() => setChoice(schedule.preferenceOrder)}
                className="mt-0.5 accent-forest-700"
              />
              <span>
                <span className="block font-semibold text-zinc-900">Option {schedule.preferenceOrder}</span>
                <span className="text-zinc-600">{formatSchedule(schedule)}</span>
                {past && <span className="block text-[11px] text-zinc-500">This date has passed.</span>}
              </span>
            </label>
          );
        })}
      </fieldset>

      {!firstOpen && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Every preferred date has passed. Decline or cancel this request, or ask the visitor to submit new dates.
        </p>
      )}

      <DecisionNote defaultValue={state.note} />
      <VisitorEmailFields
        recipient={request.email}
        defaultNotify={notify}
        defaultMessage={state.visitorMessage}
        onNotifyChange={setNotify}
      />
      <ActionError message={state.message} />

      <ConfirmButton
        label={chosen ? `Approve option ${chosen.preferenceOrder}` : "Approve schedule"}
        question="Approve this schedule?"
        detail={
          chosen
            ? `${formatSchedule(chosen)} for ${request.visitorCount} visitor${request.visitorCount === 1 ? "" : "s"}. ${
                notify ? `${request.email} will be emailed the confirmed schedule.` : "The visitor will not be emailed."
              }`
            : undefined
        }
        confirmLabel="Yes, approve"
        disabled={!chosen}
        pending={pending}
        pendingLabel="Approving schedule…"
        className={primaryButtonClasses}
      />
    </form>
  );
}

function campusEntryText(summary: CampusEntrySummary) {
  const lines = [
    "USC Biological Museum visit – campus entry details",
    `Organization: ${summary.organization}`,
    `Contact person: ${summary.contactPerson}`,
    `Email: ${summary.email}`,
    `Contact number: ${summary.phone}`,
    `Purpose: ${summary.purpose ?? "Not given"}`,
    `Approved schedule: ${formatSchedule(summary.approvedSchedule)}`,
    `Number of visitors: ${summary.visitorCount}`,
  ];
  if (summary.visitors.length) {
    lines.push("Visitors:", ...summary.visitors.map((visitor, index) => `  ${index + 1}. ${visitor.name}`));
  }
  for (const vehicle of summary.vehicles) {
    lines.push(`Vehicle: ${[vehicle.plateNumber, vehicle.brand, vehicle.type].filter(Boolean).join(", ")}`);
  }
  if (summary.equipment) lines.push(`Equipment: ${summary.equipment}`);
  return lines.join("\n");
}

function CampusEntryCard({ summary }: { summary: CampusEntrySummary | null }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <section className={`${panelClasses} space-y-3`}>
      <PanelHeading
        icon={ClipboardIcon}
        title="Campus-entry summary"
        description="Copy these approved details into the USC campus-entry process. BioSphere does not submit them to USC."
      />
      {summary ? (
        <>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-sage-50 px-3 py-2.5 font-sans text-xs leading-relaxed text-zinc-800">
            {campusEntryText(summary)}
          </pre>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(campusEntryText(summary));
                setCopied("copied");
              } catch {
                setCopied("failed");
              }
            }}
            className={secondaryButtonClasses}
          >
            {copied === "copied" ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
            {copied === "copied" ? "Copied" : "Copy summary"}
          </button>
          <p aria-live="polite" className="text-center text-[11px] text-zinc-500">
            {copied === "failed" ? "Copy was blocked by the browser. Select the text above and copy it instead." : ""}
          </p>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          The summary could not be loaded. Reload the page to try again.
        </p>
      )}
    </section>
  );
}

export function VisitRequestDetail({
  request,
  history,
  campusEntry,
  returnQuery,
  currentAccountId,
}: {
  request: VisitRequest;
  history: CommunicationEntry[] | null;
  campusEntry: CampusEntrySummary | null;
  returnQuery: ReturnQuery;
  currentAccountId: string | null;
}) {
  const statusOptions = nextVisitStatuses(request.status).map(statusOption);
  const vehicles = request.vehicles.filter((vehicle) => vehicle.plateNumber || vehicle.brand || vehicle.type);

  return (
    <div className="space-y-4">
      <section aria-labelledby="visit-detail-heading" className={`${panelClasses} space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="visit-detail-heading" className="break-words text-base font-semibold text-zinc-900">
              {request.organization}
            </h2>
            <p className="text-xs text-zinc-500">
              Visit request <span className="font-mono">{request.referenceCode}</span> ·{" "}
              {formatTimestamp(request.createdAt)}
            </p>
          </div>
          <VisitStatusBadge status={request.status} />
        </div>

        {request.approvedSchedule && (
          <p className="flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">
            <CheckIcon className="h-4 w-4 shrink-0" />
            Approved: {formatSchedule(request.approvedSchedule)}
          </p>
        )}

        <dl className="divide-y divide-black/5 border-y border-black/5">
          <InfoRow label="Contact person">{request.name}</InfoRow>
          <InfoRow label="Email">{request.email}</InfoRow>
          <InfoRow label="Contact number">{request.phone}</InfoRow>
          <InfoRow label="Address">{request.address ?? <NotGiven />}</InfoRow>
          <InfoRow label="Purpose">
            <span className="whitespace-pre-line">{request.purpose ?? <NotGiven />}</span>
          </InfoRow>
          <InfoRow label="Equipment">{request.equipment ?? <NotGiven />}</InfoRow>
          <InfoRow label="Notes">
            <span className="whitespace-pre-line">{request.notes ?? <NotGiven />}</span>
          </InfoRow>
          <InfoRow label="Privacy consent">Accepted {formatTimestamp(request.consentAcceptedAt)}</InfoRow>
        </dl>

        {!canApproveSchedule(request.status) && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <CalendarIcon className="h-3.5 w-3.5" />
              Preferred schedules
            </p>
            <ol className="space-y-1 text-xs text-zinc-700">
              {request.preferredSchedules.map((schedule) => (
                <li key={schedule.preferenceOrder}>
                  {schedule.preferenceOrder}. {formatSchedule(schedule)}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <UsersIcon className="h-3.5 w-3.5" />
            {request.visitorCount} visitor{request.visitorCount === 1 ? "" : "s"}
            {request.visitors.length > 0 && `, ${request.visitors.length} named`}
          </p>
          {request.visitors.length > 0 && (
            <ol className="max-h-40 list-decimal space-y-0.5 overflow-y-auto pl-8 text-xs text-zinc-700">
              {request.visitors.map((visitor, index) => (
                <li key={`${visitor.name}-${index}`}>{visitor.name}</li>
              ))}
            </ol>
          )}
        </div>

        {vehicles.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <CarIcon className="h-3.5 w-3.5" />
              Vehicle
            </p>
            <ul className="space-y-0.5 text-xs text-zinc-700">
              {vehicles.map((vehicle, index) => (
                <li key={index}>
                  <span className="font-mono font-semibold">{vehicle.plateNumber ?? "No plate given"}</span>
                  {[vehicle.brand, vehicle.type].filter(Boolean).length > 0 &&
                    ` · ${[vehicle.brand, vehicle.type].filter(Boolean).join(", ")}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.sourceInquiryId && (
          <Link
            href={publicWebsiteHref({ tab: "inquiries" }, { selected: request.sourceInquiryId })}
            className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-50"
          >
            Open the inquiry this request came from
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </section>

      {canApproveSchedule(request.status) && (
        <ApproveScheduleForm
          key={request.id}
          request={request}
          action={approveVisitScheduleAction.bind(null, request.id, returnQuery)}
        />
      )}

      {request.approvedSchedule && <CampusEntryCard summary={campusEntry} />}

      {statusOptions.length > 0 && (
        <StatusChangeForm
          key={`${request.id}-${request.status}`}
          action={updateVisitStatusAction.bind(null, request.id, returnQuery)}
          options={statusOptions}
          recordLabel="visit request"
          visitorEmail={{
            recipient: request.email,
            sendsFor: (status) => emailsVisitorOnStatus(status as CuratorSettableVisitStatus),
          }}
        />
      )}

      <EmailVisitorForm
        key={`message-${request.id}`}
        action={sendVisitMessageAction.bind(null, request.id, returnQuery)}
        recipient={request.email}
        title="Email the visitor"
        description="Ask for more information or share details. The request's status does not change."
        placeholder="e.g. Could you send the full list of students joining the visit?"
      />

      <section className={`${panelClasses} space-y-4`}>
        <PanelHeading icon={ChatIcon} title="Notes and history" />
        <NoteForm key={request.id} action={addVisitNoteAction.bind(null, request.id, returnQuery)} />
        <HistoryTimeline
          submittedAt={request.createdAt}
          entries={history}
          statusLabels={VISIT_REQUEST_STATUS_LABELS}
          currentAccountId={currentAccountId}
        />
      </section>
    </div>
  );
}
