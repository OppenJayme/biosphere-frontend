"use client";

import { useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  CloseIcon,
  ClockIcon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  DocumentTextIcon,
  ChatIcon,
  RefreshIcon,
} from "@/components/icons";
import {
  InquiryStatusBadge,
  VisitStatusBadge,
  INQUIRY_STATUS_DOT,
  VISIT_STATUS_DOT,
} from "./StatusBadge";
import { INQUIRY_STATUSES, VISIT_STATUSES, type Inquiry, type VisitRequest } from "@/lib/dummy-data/public-website";

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
      <span className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="text-right font-medium text-zinc-800">{children}</span>
    </div>
  );
}

function ChangeStatusPanel<T extends string>({
  options,
  dots,
  current,
  label,
}: {
  options: readonly T[];
  dots: Record<T, string>;
  current: T;
  label: string;
}) {
  const [value, setValue] = useState<T>(current);

  return (
    <div className="rounded-xl border border-forest-600 bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
        <RefreshIcon className="h-4 w-4 text-forest-700" />
        Change Status
      </h3>
      <p className="mt-1 text-xs text-zinc-500">Update {label} workflow status.</p>

      <label className="mb-1.5 mt-3 block text-xs font-medium text-zinc-700">Current Status</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as T)}
          className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2.5 pl-8 pr-3 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${dots[value]}`} />
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
      >
        Update Status
      </button>
      <p className="mt-2 text-center text-[11px] text-zinc-400">Choose the current handling stage.</p>
    </div>
  );
}

export function InquiryDetailPanel({
  item,
  onClear,
}: {
  item: Inquiry | VisitRequest | null;
  onClear: () => void;
}) {
  if (!item) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected Item</h3>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select an inquiry or visit request from the table to see its details here.
        </p>
      </div>
    );
  }

  const isInquiry = item.kind === "inquiry";

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            {isInquiry ? "Selected Inquiry" : "Selected Visit Request"}
          </h3>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="text-zinc-400 hover:text-zinc-600"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2">
          {isInquiry ? <InquiryStatusBadge status={item.status} /> : <VisitStatusBadge status={item.status} />}
          <span className="ml-auto truncate text-xs text-zinc-500">Inquiry ID: {item.id}</span>
        </div>

        <div className="divide-y divide-black/5">
          <InfoRow icon={ClockIcon} label="Timestamp">
            {item.timestampFull}
          </InfoRow>

          {isInquiry ? (
            <>
              <InfoRow icon={UsersIcon} label="Sender">
                <span className="flex items-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${item.sender.color}`}>
                    {item.sender.initials}
                  </span>
                  {item.sender.name}
                </span>
              </InfoRow>
              <InfoRow icon={MailIcon} label="Email">
                {item.email}
              </InfoRow>
              <InfoRow icon={DocumentTextIcon} label="Subject">
                {item.subject}
              </InfoRow>
            </>
          ) : (
            <>
              <InfoRow icon={UsersIcon} label="Requested By">
                {item.requestedBy}
              </InfoRow>
              <InfoRow icon={UsersIcon} label="Contact Person">
                {item.contactPerson}
              </InfoRow>
              <InfoRow icon={MailIcon} label="Email">
                {item.email}
              </InfoRow>
              <InfoRow icon={PhoneIcon} label="Phone">
                {item.phone}
              </InfoRow>
              <InfoRow icon={DocumentTextIcon} label="Purpose">
                {item.purpose}
              </InfoRow>
            </>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">{isInquiry ? "Message" : "Message / Note"}</p>
          <p className="whitespace-pre-line rounded-lg bg-sage-50 px-3 py-2.5 text-xs text-zinc-700">{item.message}</p>
        </div>

        {!isInquiry && (
          <InfoRow icon={UsersIcon} label="No. of Visitor">
            {item.visitorCount}
          </InfoRow>
        )}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          <ChatIcon className="h-4 w-4" />
          Reply To {isInquiry ? "Inquiry" : "Visit Request"}
        </button>
      </div>

      {isInquiry ? (
        <ChangeStatusPanel
          key={item.id}
          options={INQUIRY_STATUSES}
          dots={INQUIRY_STATUS_DOT}
          current={item.status}
          label="inquiry"
        />
      ) : (
        <ChangeStatusPanel
          key={item.id}
          options={VISIT_STATUSES}
          dots={VISIT_STATUS_DOT}
          current={item.status}
          label="visit request"
        />
      )}
    </div>
  );
}
