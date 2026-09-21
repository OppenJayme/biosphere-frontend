import Link from "next/link";
import type { SpecimenDetail } from "@/features/specimens/types";

function text(value: string | null | undefined) {
  return value ?? "Not recorded";
}

function date(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not recorded" : value.slice(0, 10);
}

function DetailGrid({
  entries,
}: {
  entries: Array<{ label: string; value: string | number | null | undefined }>;
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {entry.label}
          </dt>
          <dd className="mt-1 text-sm text-zinc-800">
            {typeof entry.value === "number" ? entry.value : text(entry.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-forest-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SpecimenFullDetails({ detail }: { detail: SpecimenDetail }) {
  const { specimen, collection, taxonomy, provenance, activeLots, lotOverview, media, tags } =
    detail;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Collection", value: collection?.collectionName ?? "Not assigned" },
          { label: "Active lots", value: lotOverview.activeLotCount },
          { label: "Total quantity", value: lotOverview.totalQuantity },
          { label: "Media records", value: media.length },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{item.value}</p>
          </div>
        ))}
      </div>

      <Section title="Core Record">
        <DetailGrid
          entries={[
            { label: "Accession number", value: specimen.accessionNumber },
            { label: "Category", value: specimen.specimenCategory },
            { label: "Common name", value: specimen.commonName },
            { label: "Scientific name", value: specimen.scientificName },
            { label: "Gender", value: specimen.gender },
            { label: "Classification status", value: specimen.classificationStatus },
            { label: "Catalog status", value: specimen.status },
            {
              label: "Public display eligibility",
              value: specimen.publicDisplay ? "Eligible" : "Not eligible",
            },
            { label: "Created", value: date(specimen.createdAt) },
            { label: "Last updated", value: date(specimen.updatedAt) },
          ]}
        />
        {specimen.remarks && (
          <div className="mt-5 border-t border-black/5 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Remarks</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {specimen.remarks}
            </p>
          </div>
        )}
      </Section>

      <Section
        title="Taxonomy"
        action={
          specimen.status !== "ARCHIVED" ? (
            <Link
              href={`/specimens/${specimen.id}/taxonomy`}
              className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
            >
              {taxonomy ? "Edit taxonomy" : "Add taxonomy"}
            </Link>
          ) : undefined
        }
      >
        {taxonomy ? (
          <DetailGrid
            entries={[
              { label: "Kingdom", value: taxonomy.kingdom },
              { label: "Phylum", value: taxonomy.phylum },
              { label: "Class", value: taxonomy.class },
              { label: "Order", value: taxonomy.orderName },
              { label: "Family", value: taxonomy.family },
              { label: "Genus", value: taxonomy.genus },
              { label: "Species", value: taxonomy.species },
              { label: "Habitat", value: taxonomy.habitat },
              { label: "Ecological role", value: taxonomy.ecologicalRole },
              { label: "Conservation status", value: taxonomy.conservationStatus },
            ]}
          />
        ) : (
          <p className="text-sm text-zinc-500">No taxonomy record has been added.</p>
        )}
      </Section>

      <Section title="Provenance and Preservation">
        {provenance ? (
          <DetailGrid
            entries={[
              { label: "Collector", value: provenance.collector },
              { label: "Donor", value: provenance.donor },
              { label: "Collection date", value: date(provenance.collectionDate) },
              { label: "Collection location", value: provenance.collectionLocation },
              { label: "Preservation type", value: provenance.preservationType },
              { label: "Preservation method", value: provenance.preservationMethod },
            ]}
          />
        ) : (
          <p className="text-sm text-zinc-500">No provenance record has been added.</p>
        )}
      </Section>

      <Section title="Active Lots and Storage">
        {activeLots.length === 0 ? (
          <p className="text-sm text-zinc-500">No active specimen lots are assigned.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {activeLots.map((lot) => (
              <article key={lot.id} className="rounded-lg border border-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {lot.storageUnit.label}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {lot.storageUnit.unitType} · {lot.storageUnit.storageType}
                    </p>
                  </div>
                  <span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-forest-800">
                    Qty {lot.quantity}
                  </span>
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  Condition: <span className="font-medium text-zinc-800">{lot.conditionClass}</span>
                </p>
                {lot.storageNotes && (
                  <p className="mt-2 text-xs leading-5 text-zinc-600">{lot.storageNotes}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Media Metadata">
          {media.length === 0 ? (
            <p className="text-sm text-zinc-500">No specimen media has been added.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {media.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-zinc-800">{item.caption ?? "Uncaptioned media"}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Display order {item.displayOrder} · Added {date(item.createdAt)}
                    </p>
                  </div>
                  {item.isCover && (
                    <span className="rounded-full bg-forest-100 px-2 py-1 text-[11px] font-medium text-forest-700">
                      Cover
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Tags">
          {tags.length === 0 ? (
            <p className="text-sm text-zinc-500">No tags are attached.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-sage-100 px-3 py-1.5 text-xs font-medium text-forest-800"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
