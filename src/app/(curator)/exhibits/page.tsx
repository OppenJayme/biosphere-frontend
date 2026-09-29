/** Curator QR exhibit management (SRS 4.12) and the curator's AR on/off switch (SRS 4.13). */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { StatCard } from "@/components/ui/StatCard";
import { ExhibitsWorkspace } from "@/components/exhibits/ExhibitsWorkspace";
import { getExhibit, listExhibits } from "@/features/exhibits-qr/api";
import { parseExhibitListQuery } from "@/features/exhibits-qr/form";
import type { Exhibit } from "@/features/exhibits-qr/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "QR Exhibits",
};

type ExhibitsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const notices: Record<string, string> = {
  created: "The exhibit was created as unpublished. Add images, then publish it when it is ready.",
  published: "The exhibit is published. Its QR code and direct URL now open the public page.",
  unpublished: "The exhibit is unpublished. Its URL now shows the unavailable page.",
  disabled: "The exhibit is disabled. Its URL now shows the unavailable page.",
  archived: "The exhibit was archived. Its QR code and URL no longer open a page.",
  "ar-on": "AR is on. Visitors with a supported device can now use View in AR.",
  "ar-off": "AR is off. The View in AR action is hidden; the exhibit page stays available.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function percent(part: number, total: number) {
  return total ? `${Math.round((part / total) * 100)}% of active` : "No active exhibits";
}

export default async function ExhibitsPage({ searchParams }: ExhibitsPageProps) {
  if (!(await verifySession())) redirect("/login?from=/exhibits");

  const params = await searchParams;
  const query = parseExhibitListQuery(params);
  const filtered = Boolean(query.status || query.ar || query.search);
  const selectedId = z.uuid().safeParse(firstValue(params.selected));
  const notice = notices[firstValue(params.notice) ?? ""];

  let all: Exhibit[] = [];
  let exhibits: Exhibit[] = [];
  let errorMessage: string | undefined;
  let selected: Exhibit | null = null;
  let selectedError: string | undefined;

  try {
    const [everything, matching] = await Promise.all([
      listExhibits(),
      filtered ? listExhibits(query) : Promise.resolve(null),
    ]);
    all = everything;
    exhibits = matching ?? everything;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?from=/exhibits");
    errorMessage =
      error instanceof ApiError && error.status === 403
        ? "Your account does not have permission to manage QR exhibits."
        : "QR exhibits are temporarily unavailable. Check the backend connection and try again.";
  }

  if (selectedId.success && !errorMessage) {
    try {
      selected = await getExhibit(selectedId.data);
      // Archiving is final, so an old link to an archived exhibit shows no actions.
      if (selected.archivedAt) {
        selected = null;
        selectedError = "This exhibit was archived. Its QR code and URL no longer open a page.";
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) redirect("/login?from=/exhibits");
      selectedError =
        error instanceof ApiError && error.status === 404
          ? "This exhibit no longer exists or was archived."
          : "The selected exhibit could not be loaded. Try again.";
    }
  }

  const count = (predicate: (exhibit: Exhibit) => boolean) => all.filter(predicate).length;
  const published = count((exhibit) => exhibit.status === "PUBLISHED");
  const unpublished = count((exhibit) => exhibit.status === "UNPUBLISHED");
  const disabled = count((exhibit) => exhibit.status === "DISABLED");
  const withAr = count((exhibit) => exhibit.arEnabled);

  const stats = [
    { label: "Active Exhibits", value: String(all.length), note: "Not archived", tone: "neutral", icon: "cube" },
    { label: "Published", value: String(published), note: percent(published, all.length), tone: "positive", icon: "specimen" },
    { label: "Unpublished", value: String(unpublished), note: percent(unpublished, all.length), tone: "warning", icon: "draft" },
    { label: "Disabled", value: String(disabled), note: percent(disabled, all.length), tone: disabled ? "danger" : "neutral", icon: "lock" },
    { label: "AR On", value: String(withAr), note: percent(withAr, all.length), tone: "positive", icon: "ar" },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">QR Exhibits</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create, publish, and print QR exhibit pages for Cataloged specimens approved for public display.
        </p>
      </div>

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}

      {!errorMessage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <ExhibitsWorkspace
        key={selected?.id ?? "none"}
        exhibits={exhibits}
        query={query}
        filtered={filtered}
        selected={selected}
        selectedError={selectedError}
        errorMessage={errorMessage}
      />
    </div>
  );
}
