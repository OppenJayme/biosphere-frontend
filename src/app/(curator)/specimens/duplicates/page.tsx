/**
 * Duplicate review (panel recommendation, 2026-11-28): every active record that matches another
 * active record, grouped, with the values to compare and why they matched. Matching rules are the
 * backend's, unchanged; nothing here merges, deletes or dismisses. The dashboard shows the same
 * record count.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/curator/PageHeader";
import { DuplicateArchiveControl } from "@/components/specimens/DuplicateArchiveControl";
import { getDuplicateReview } from "@/features/specimens/api";
import {
  describeReviewMatch,
  DUPLICATE_REVIEW_ROWS,
  matchedFieldsInGroup,
  reviewEditHrefs,
  reviewRecordLabel,
} from "@/features/specimens/duplicate-review";
import type { DuplicateReviewGroup } from "@/features/specimens/types";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = { title: "Possible Duplicates" };

const STATUS_LABELS = { UNCATALOGED: "Uncataloged", CATALOGED: "Cataloged", ARCHIVED: "Archived" } as const;

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DuplicateReviewPage({ searchParams }: PageProps) {
  if (!(await verifySession())) redirect("/login?from=/specimens/duplicates");
  const archived = (await searchParams).archived === "1";

  let review;
  try {
    review = await getDuplicateReview();
  } catch {
    return (
      <div className="space-y-5">
        <Header />
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The duplicate review could not be loaded.</p>
          <p className="mt-1 text-amber-900">Nothing was changed. Check your connection and try again.</p>
          <Link
            href="/specimens/duplicates"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header />

      {archived && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          The record was archived. Its history is kept, and it no longer appears here or in the active catalog.
        </p>
      )}

      <section className="rounded-xl border border-black/10 bg-white p-5 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">
          {review.recordCount === 0
            ? "No records need a duplicate review."
            : `${review.recordCount} ${review.recordCount === 1 ? "record needs" : "records need"} review, in ${review.groupCount} ${review.groupCount === 1 ? "group" : "groups"}.`}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600">
          <li>
            Records match on the same accession number, or the same species without a different collector or donor
            to tell them apart. Only active records are compared.
          </li>
          <li>
            <strong className="font-medium text-zinc-800">If two records are the same specimen</strong>, archive the
            extra one. Its history is kept.
          </li>
          <li>
            <strong className="font-medium text-zinc-800">If a value is wrong or missing</strong> and you can verify the
            right one, edit the record. Change only what you know to be accurate.
          </li>
          <li>
            <strong className="font-medium text-zinc-800">If they are separate specimens</strong> that share these
            details, leave them as they are. Separate specimens can share a collector or donor; they stay listed here.
          </li>
        </ul>
      </section>

      {review.groups.map((group) => (
        <ReviewGroup key={group.records.map((record) => record.specimenId).join(":")} group={group} />
      ))}
    </div>
  );
}

function Header() {
  return (
    <>
      <Link href="/specimens" className="text-sm font-medium text-forest-800 hover:underline">
        ← Specimens
      </Link>
      <PageHeader
        title="Possible duplicates"
        description="Compare matching records side by side, then open, edit or archive them."
      />
    </>
  );
}

function ReviewGroup({ group }: { group: DuplicateReviewGroup }) {
  const matched = matchedFieldsInGroup(group);
  const high = group.matches.some((match) => match.confidence === "HIGH");
  const title = group.records[0].commonName ?? group.records[0].scientificName ?? reviewRecordLabel(group.records[0]);

  return (
    <section
      aria-label={`${group.records.length} possible duplicates: ${title}`}
      className="rounded-xl border border-black/10 bg-white p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-lg font-semibold text-forest-900">{title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${high ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}
        >
          {high ? "High confidence" : "Medium confidence"}
        </span>
        <span className="text-xs text-zinc-500">{group.records.length} records</span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-zinc-700">
        {group.matches.map((match) => {
          const line = describeReviewMatch(group, match);
          return (
            <li key={`${match.firstSpecimenId}:${match.secondSpecimenId}`}>
              <span className="font-medium text-zinc-900">{line.pair}:</span> {line.matched ?? "Matched"}.
              {line.differing && <span className="text-zinc-500"> {line.differing}.</span>}
              <span className="ml-1 text-xs text-zinc-500">({line.confidence})</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-black/10 bg-sage-50 text-xs text-zinc-600">
            <tr>
              <th scope="col" className="w-40 px-3 py-2.5 font-medium">
                <span className="sr-only">Field</span>
              </th>
              {group.records.map((record) => (
                <th key={record.specimenId} scope="col" className="px-3 py-2.5 font-semibold text-zinc-900">
                  {reviewRecordLabel(record)}
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.6875rem] font-medium text-zinc-700">
                    {STATUS_LABELS[record.status]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {DUPLICATE_REVIEW_ROWS.map((row) => {
              const isMatch = row.field ? matched.has(row.field) : false;
              return (
                <tr key={row.key}>
                  <th scope="row" className="px-3 py-2 text-xs font-medium text-zinc-500">
                    {row.label}
                    {isMatch && <span className="ml-1.5 font-semibold text-amber-800">· matches</span>}
                  </th>
                  {group.records.map((record) => (
                    <td
                      key={record.specimenId}
                      className={`px-3 py-2 ${isMatch && record[row.key] ? "bg-amber-50 text-amber-950" : "text-zinc-700"}`}
                    >
                      {record[row.key] ?? <span className="text-zinc-400">Not recorded</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <th scope="row" className="px-3 py-2 text-xs font-medium text-zinc-500">
                Active lots
              </th>
              {group.records.map((record) => (
                <td key={record.specimenId} className="px-3 py-2 text-zinc-700 tabular-nums">
                  {record.activeLotCount}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-2.5 align-top text-xs font-medium text-zinc-500">
                Actions
              </th>
              {group.records.map((record) => {
                const label = reviewRecordLabel(record);
                const edit = reviewEditHrefs(record);
                return (
                  <td key={record.specimenId} className="px-3 py-2.5 align-top">
                    <div className="flex max-w-56 flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                        <Link
                          href={`/specimens/${record.specimenId}`}
                          className="rounded-lg border border-black/15 px-2.5 py-1.5 text-zinc-700 hover:bg-zinc-50"
                          aria-label={`Open ${label}`}
                        >
                          Open
                        </Link>
                        {/* Plain links: a client-side jump from here to /specimens/[id]/edit is caught by the
                            details page's dialog routes (this URL looks like /specimens/[id]) and 404s. */}
                        <a
                          href={edit.details}
                          className="rounded-lg border border-forest-700 px-2.5 py-1.5 text-forest-800 hover:bg-forest-50"
                          aria-label={`Edit ${label}`}
                        >
                          Edit
                        </a>
                        <a
                          href={edit.provenance}
                          className="rounded-lg border border-forest-700 px-2.5 py-1.5 text-forest-800 hover:bg-forest-50"
                          aria-label={`Edit provenance of ${label}`}
                        >
                          Edit provenance
                        </a>
                      </div>
                      <DuplicateArchiveControl record={record} label={label} />
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
