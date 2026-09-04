import {
  MoveIcon,
  PencilIcon,
  QrCodeIcon,
  ClockIcon,
  CloseIcon,
  BugIcon,
  LizardIcon,
  LeafIcon,
  PawIcon,
  FishIcon,
} from "@/components/icons";
import type { Specimen } from "@/lib/dummy-data/specimens";

const GROUP_ICONS = {
  insect: BugIcon,
  reptile: LizardIcon,
  botany: LeafIcon,
  mammal: PawIcon,
  marine: FishIcon,
} as const;

const CATALOG_STATUS_STYLES: Record<Specimen["catalogStatus"], string> = {
  Cataloged: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-sky-100 text-sky-700",
  Archived: "bg-amber-100 text-amber-700",
};

const CONDITION_DOT: Record<Specimen["condition"], string> = {
  Good: "bg-forest-600",
  Fair: "bg-amber-500",
  Poor: "bg-red-500",
};

const QUICK_ACTIONS = [
  { label: "Move Specimen", icon: MoveIcon },
  { label: "Edit Record", icon: PencilIcon },
  { label: "Print QR", icon: QrCodeIcon },
  { label: "History", icon: ClockIcon },
] as const;

export function SpecimenDetailPanel({
  specimen,
  onClear,
}: {
  specimen: Specimen | null;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              title={action.label}
              disabled={!specimen}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-black/10 py-3 text-zinc-600 transition-colors hover:bg-sage-100 hover:text-forest-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <action.icon className="h-4.5 w-4.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Selected Specimen</h3>
          {specimen && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear selection"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {!specimen ? (
          <p className="py-6 text-center text-xs text-zinc-500">
            Select a specimen from the table to see its details here.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500">{specimen.accessionNo}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${CATALOG_STATUS_STYLES[specimen.catalogStatus]}`}
              >
                {specimen.catalogStatus}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{specimen.commonName}</p>
              <p className="text-xs italic text-zinc-500">{specimen.scientificName}</p>
            </div>

            <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              {(() => {
                const Icon = GROUP_ICONS[specimen.group];
                return <Icon className="h-10 w-10" />;
              })()}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-zinc-400">Collection type</dt>
                <dd className="text-zinc-800">{specimen.collectionType}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Family</dt>
                <dd className="text-zinc-800">{specimen.family}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Order</dt>
                <dd className="text-zinc-800">{specimen.order}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Storage Location</dt>
                <dd className="text-zinc-800">{specimen.storageLocation}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Condition</dt>
                <dd className="flex items-center gap-1.5 text-zinc-800">
                  <span className={`h-2 w-2 rounded-full ${CONDITION_DOT[specimen.condition]}`} />
                  {specimen.condition}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Preservation</dt>
                <dd className="text-zinc-800">{specimen.preservation}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Date Collected</dt>
                <dd className="text-zinc-800">{specimen.dateCollection}</dd>
              </div>
              <div>
                <dt className="text-zinc-400">Collector</dt>
                <dd className="text-zinc-800">{specimen.collector}</dd>
              </div>
            </dl>

            <div>
              <p className="mb-1.5 text-xs text-zinc-400">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {specimen.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium text-forest-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {specimen && specimen.recentActivity.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Recent Activity</h3>
          <ul className="space-y-3">
            {specimen.recentActivity.map((entry) => (
              <li key={entry.timestamp} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{entry.timestamp}</p>
                  <p className="text-xs text-zinc-800">{entry.description}</p>
                  <p className="text-[11px] text-zinc-400">by {entry.by}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
