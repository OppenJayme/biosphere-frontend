/**
 * Developer deployment of approved AR assets for curator-approved exhibits (REQ-4.2-04, REQ-4.2-05).
 *
 * The panel lists exhibits as a searchable, filterable grid. Each exhibit opens a side drawer
 * that holds its deployed models and, when it is still deployable, the upload form for it.
 */

"use client";

import { useActionState, useId, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/dashboard/Panel";
import { CubeIcon, SearchIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModalButton } from "@/components/ui/ModalButton";
import { TablePagination } from "@/components/ui/TablePagination";
import { ModelFilePreview } from "./ModelFilePreview";
import {
  activateArAssetAction,
  deactivateArAssetAction,
  removeArAssetAction,
} from "@/features/developer/actions";
import {
  AR_ASSET_ACCEPT,
  AUTHORIZATION_REASON_MAX_LENGTH,
  firstValidationMessage,
  readArAssetCreateForm,
  readArAssetReplaceForm,
  type ArAssetCommandState,
} from "@/features/developer/form";
import {
  AR_MODEL_FORMATS,
  arAssetSchema,
  type ArAsset,
  type ArExhibit,
  type ArModelFormat,
} from "@/features/developer/types";

type Notice = { tone: "success" | "error"; message: string };

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const fileInputClasses = `${inputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-forest-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-forest-800`;

const primaryButtonClasses =
  "rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const outlineButtonClasses =
  "rounded-lg border border-forest-700 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClasses =
  "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

// Two full rows of the five-column grid on wide screens.
const EXHIBIT_PAGE_SIZE = 10;

const AUTHORIZATION_PLACEHOLDER = "e.g. Curator AR approval memo no., approving official, and date";

/* ----------------------------------------------------------------------------------------------
 * Format coverage and filters
 * -------------------------------------------------------------------------------------------- */

type FormatState = "active" | "inactive" | "missing";

/** "active" when an enabled asset of the format exists, "inactive" when only disabled ones do. */
function formatState(exhibit: ArExhibit, format: ArModelFormat): FormatState {
  const assets = exhibit.assets.filter((asset) => asset.modelFormat === format);
  if (assets.some((asset) => asset.isEnabled)) return "active";
  return assets.length > 0 ? "inactive" : "missing";
}

function hasFormat(exhibit: ArExhibit, format: ArModelFormat) {
  return exhibit.assets.some((asset) => asset.modelFormat === format);
}

const EXHIBIT_FILTERS = {
  all: { label: "All", test: () => true },
  glb: { label: "Has GLB", test: (exhibit: ArExhibit) => hasFormat(exhibit, "glb") },
  usdz: { label: "Has USDZ", test: (exhibit: ArExhibit) => hasFormat(exhibit, "usdz") },
  both: {
    label: "Has both",
    test: (exhibit: ArExhibit) => hasFormat(exhibit, "glb") && hasFormat(exhibit, "usdz"),
  },
  missing: {
    label: "Missing a format",
    test: (exhibit: ArExhibit) => exhibit.deployable && !(hasFormat(exhibit, "glb") && hasFormat(exhibit, "usdz")),
  },
  none: { label: "No assets", test: (exhibit: ArExhibit) => exhibit.assets.length === 0 },
  cleanup: { label: "Cleanup only", test: (exhibit: ArExhibit) => !exhibit.deployable },
} as const;

type ExhibitFilter = keyof typeof EXHIBIT_FILTERS;

function matchesQuery(exhibit: ArExhibit, needle: string) {
  if (!needle) return true;
  return [exhibit.commonName, exhibit.scientificName, exhibit.publicSlug].some((value) =>
    value?.toLowerCase().includes(needle),
  );
}

/** True when visitors would only get a USDZ model, which Android and desktop browsers cannot open. */
function usdzOnly(assets: ArAsset[]) {
  const formats = new Set(assets.filter((asset) => asset.isEnabled).map((asset) => asset.modelFormat));
  return formats.has("usdz") && !formats.has("glb");
}

/* ----------------------------------------------------------------------------------------------
 * Shared form pieces
 * -------------------------------------------------------------------------------------------- */

function NoticeLine({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return notice.tone === "error" ? (
    <p role="alert" className="mt-2 text-xs font-medium text-red-700">
      {notice.message}
    </p>
  ) : (
    <p role="status" className="mt-2 text-xs font-medium text-emerald-700">
      {notice.message}
    </p>
  );
}

function CommandMessage({ state }: { state: ArAssetCommandState }) {
  return state.message ? (
    <p role="alert" className="mt-2 text-xs font-medium text-red-700">
      {state.message}
    </p>
  ) : null;
}

async function responseMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // Fall through to the generic message.
  }
  return "The AR model could not be deployed. Try again later.";
}

function FormatSelect({
  disabled,
  onChange,
}: {
  disabled: boolean;
  onChange?: (format: ArModelFormat) => void;
}) {
  return (
    <label className="text-xs font-medium text-zinc-700">
      Model format
      <select
        name="modelFormat"
        required
        disabled={disabled}
        defaultValue="glb"
        onChange={(event) => onChange?.(event.target.value as ArModelFormat)}
        className={inputClasses}
      >
        {AR_MODEL_FORMATS.map((format) => (
          <option key={format} value={format}>
            {format.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuthorizationField({ disabled, hint }: { disabled: boolean; hint: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
        Curator authorization (required)
      </label>
      <textarea
        id={id}
        name="authorizationReference"
        // Not `required`: a confirm dialog can make the page inert and hide the browser's
        // validation bubble. The form parser returns the message instead.
        aria-required="true"
        rows={2}
        maxLength={AUTHORIZATION_REASON_MAX_LENGTH}
        disabled={disabled}
        placeholder={AUTHORIZATION_PLACEHOLDER}
        className={`${inputClasses} resize-y`}
      />
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function UsdzOnlyWarning({ children }: { children: string }) {
  return <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">{children}</p>;
}

/** Upload or replace a model through the same-origin route, then reload the server list. */
function useModelUpload() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function upload(form: HTMLFormElement, method: "POST" | "PUT", success: (asset: ArAsset) => string) {
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/developer/ar-assets", { method, body: new FormData(form) });
      if (!response.ok) {
        setNotice({ tone: "error", message: await responseMessage(response) });
        return;
      }
      const result = arAssetSchema.safeParse(await response.json());
      if (!result.success) {
        setNotice({ tone: "error", message: "The upload finished but returned an invalid response. Check the audit log." });
        return;
      }
      form.reset();
      setNotice({ tone: "success", message: success(result.data) });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "The upload failed. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return { pending, notice, setNotice, upload };
}

/* ----------------------------------------------------------------------------------------------
 * Drawer contents
 * -------------------------------------------------------------------------------------------- */

/** Upload form for one exhibit; the exhibit is fixed by the drawer it sits in. */
function UploadForm({ exhibit }: { exhibit: ArExhibit }) {
  const { pending, notice, setNotice, upload } = useModelUpload();
  const [file, setFile] = useState<File | null>(null);
  // Suggest the format the exhibit lacks, GLB first because Android and desktop need it.
  const suggested: ArModelFormat = hasFormat(exhibit, "glb") && !hasFormat(exhibit, "usdz") ? "usdz" : "glb";
  const [format, setFormat] = useState<ArModelFormat>(suggested);
  // Only an active GLB reaches visitors; an inactive one does not cover Android and desktop.
  const exhibitHasActiveGlb = formatState(exhibit, "glb") === "active";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const parsed = readArAssetCreateForm(new FormData(form));
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstValidationMessage(parsed.error) });
      return;
    }
    void upload(form, "POST", (asset) =>
      asset.isEnabled
        ? "The AR asset was deployed and is active."
        : "The AR asset was deployed. It stays inactive until you activate it.",
    );
  }

  return (
    <form
      onSubmit={submit}
      // form.reset() after a successful upload also clears the preview and warning.
      onReset={() => {
        setFile(null);
        setFormat(suggested);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <input type="hidden" name="exhibitId" value={exhibit.id} />
      <label className="text-xs font-medium text-zinc-700">
        Model format
        <select
          name="modelFormat"
          required
          disabled={pending}
          value={format}
          onChange={(event) => setFormat(event.target.value as ArModelFormat)}
          className={inputClasses}
        >
          {AR_MODEL_FORMATS.map((option) => (
            <option key={option} value={option}>
              {option.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-zinc-700">
        Model file
        <input
          type="file"
          name="file"
          accept={AR_ASSET_ACCEPT}
          required
          disabled={pending}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className={fileInputClasses}
        />
      </label>
      <p className="text-xs text-zinc-500 sm:col-span-2">
        Single-file GLB (up to 15 MB, so Android Scene Viewer can open it) or USDZ (up to 50 MB). The file&apos;s
        extension and contents must match the selected format.
      </p>
      {format === "usdz" && !exhibitHasActiveGlb && (
        <div className="sm:col-span-2">
          <UsdzOnlyWarning>
            This exhibit has no active GLB model. A USDZ file only opens on iPhone and iPad, so Android and desktop
            visitors will not see a 3D model. Upload or activate a GLB version as well.
          </UsdzOnlyWarning>
        </div>
      )}
      {file && (
        <div className="sm:col-span-2">
          <ModelFilePreview key={`${file.name}-${file.lastModified}-${file.size}`} file={file} />
        </div>
      )}
      <div className="sm:col-span-2">
        <AuthorizationField disabled={pending} hint="Recorded in the audit log with this deployment." />
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-700 sm:col-span-2">
        <input
          type="checkbox"
          name="isEnabled"
          disabled={pending}
          className="h-4 w-4 rounded border-black/20 accent-forest-700"
        />
        Activate immediately (otherwise the asset is deployed inactive)
      </label>
      <div className="sm:col-span-2">
        <ConfirmButton
          label="Upload asset"
          question="Upload this AR asset?"
          detail="The file is saved for this exhibit."
          confirmLabel="Upload asset"
          pending={pending}
          pendingLabel="Uploading AR asset…"
          className={primaryButtonClasses}
        />
        <NoticeLine notice={notice} />
      </div>
    </form>
  );
}

function ActivateControl({ asset }: { asset: ArAsset }) {
  const action = activateArAssetAction.bind(null, asset.id);
  const [state, formAction, pending] = useActionState<ArAssetCommandState, FormData>(action, {});

  return (
    <details className="w-full">
      <summary className="cursor-pointer text-xs font-semibold text-forest-800 hover:underline">Activate…</summary>
      <form action={formAction} className="mt-2 space-y-2">
        <AuthorizationField disabled={pending} hint="Recorded in the audit log with the activation." />
        <ConfirmButton
          label="Activate asset"
          question="Activate this AR asset?"
          detail="Only activate an asset that passed technical review. Visitors can then open it from the exhibit page when the curator has AR switched on."
          confirmLabel="Yes, activate"
          pending={pending}
          pendingLabel="Activating AR asset…"
          className={outlineButtonClasses}
        />
        <CommandMessage state={state} />
      </form>
    </details>
  );
}

function DeactivateControl({ asset }: { asset: ArAsset }) {
  const action = deactivateArAssetAction.bind(null, asset.id);
  const [state, formAction, pending] = useActionState<ArAssetCommandState, FormData>(action, {});

  return (
    <form action={formAction}>
      <ConfirmButton
        label="Deactivate"
        question="Deactivate this AR asset?"
        detail="Visitors will no longer be offered this AR model. The exhibit page keeps its non-AR view."
        confirmLabel="Yes, deactivate"
        pending={pending}
        pendingLabel="Deactivating AR asset…"
        className={outlineButtonClasses}
      />
      <CommandMessage state={state} />
    </form>
  );
}

function RemoveControl({ asset }: { asset: ArAsset }) {
  const action = removeArAssetAction.bind(null, asset.id);
  const [state, formAction, pending] = useActionState<ArAssetCommandState, FormData>(action, {});

  return (
    <form action={formAction}>
      <ConfirmButton
        label="Remove"
        question="Remove this AR asset?"
        detail="The asset record and its stored model file are deleted. This cannot be undone; the model would have to be uploaded again."
        confirmLabel="Yes, remove"
        tone="danger"
        pending={pending}
        pendingLabel="Removing AR asset…"
        className={dangerButtonClasses}
      />
      <CommandMessage state={state} />
    </form>
  );
}

function ReplaceControl({ asset }: { asset: ArAsset }) {
  const { pending, notice, setNotice, upload } = useModelUpload();
  const [file, setFile] = useState<File | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const parsed = readArAssetReplaceForm(new FormData(form));
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstValidationMessage(parsed.error) });
      return;
    }
    void upload(form, "PUT", () => "The model file was replaced. Its active state is unchanged.");
  }

  return (
    <details className="w-full">
      <summary className="cursor-pointer text-xs font-semibold text-forest-800 hover:underline">Replace file…</summary>
      <form onSubmit={submit} onReset={() => setFile(null)} className="mt-2 grid gap-2">
        <input type="hidden" name="assetId" value={asset.id} />
        <FormatSelect disabled={pending} />
        <label className="text-xs font-medium text-zinc-700">
          Replacement file
          <input
            type="file"
            name="file"
            accept={AR_ASSET_ACCEPT}
            required
            disabled={pending}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className={fileInputClasses}
          />
        </label>
        {file && <ModelFilePreview key={`${file.name}-${file.lastModified}-${file.size}`} file={file} />}
        <AuthorizationField disabled={pending} hint="Recorded in the audit log with the replacement." />
        <div>
          <ConfirmButton
            label="Replace file"
            question="Replace this model file?"
            detail="The current file is replaced by the one you chose."
            confirmLabel="Replace file"
            tone="danger"
            pending={pending}
            pendingLabel="Replacing AR model…"
            className={outlineButtonClasses}
          />
          <NoticeLine notice={notice} />
        </div>
      </form>
    </details>
  );
}

function AssetRow({ asset, deployable }: { asset: ArAsset; deployable: boolean }) {
  return (
    <li className="rounded-lg border border-black/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-forest-50 px-2 py-0.5 text-xs font-bold uppercase text-forest-800 ring-1 ring-forest-700/20">
            {asset.modelFormat}
          </span>
          {asset.isEnabled ? (
            <span className="text-xs font-semibold text-emerald-700">Active</span>
          ) : (
            <span className="text-xs font-medium text-zinc-500">Inactive</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {asset.isEnabled && <DeactivateControl asset={asset} />}
          <RemoveControl asset={asset} />
        </div>
      </div>
      <p className="mt-1 truncate font-mono text-[11px] text-zinc-400" title={asset.id}>
        {asset.id}
      </p>
      {deployable && (
        <div className="mt-2 space-y-2 border-t border-black/5 pt-2">
          {!asset.isEnabled && <ActivateControl asset={asset} />}
          <ReplaceControl asset={asset} />
        </div>
      )}
    </li>
  );
}

function ExhibitDetails({ exhibit }: { exhibit: ArExhibit }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-600 ring-1 ring-zinc-200">
          {exhibit.status.toLowerCase()}
        </span>
        {!exhibit.deployable && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            Cleanup only
          </span>
        )}
        <span className="font-mono text-xs leading-5 text-zinc-500">/exhibits/{exhibit.publicSlug}</span>
      </div>

      {exhibit.arSelected && exhibit.arSelectionNote && (
        <p className="rounded-lg bg-sage-50 px-3 py-2 text-xs whitespace-pre-line text-zinc-700">
          <span className="font-semibold">Curator&apos;s reason: </span>
          {exhibit.arSelectionNote}
        </p>
      )}

      {!exhibit.deployable && (
        <p className="text-xs text-amber-900">
          {exhibit.archived
            ? "This exhibit is archived."
            : !exhibit.arSelected
              ? "The curator withdrew this exhibit's AR selection."
              : "This exhibit is no longer approved for public display."}{" "}
          Its assets can only be deactivated or removed.
        </p>
      )}

      {usdzOnly(exhibit.assets) && (
        <UsdzOnlyWarning>
          Only a USDZ model is active, so the 3D model opens on iPhone and iPad only. Deploy a GLB version so
          Android and desktop visitors can view it too.
        </UsdzOnlyWarning>
      )}

      <section aria-labelledby={`assets-${exhibit.id}`}>
        <h3 id={`assets-${exhibit.id}`} className="text-sm font-semibold text-zinc-900">
          Deployed models
        </h3>
        {exhibit.assets.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">No AR asset deployed yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {exhibit.assets.map((asset) => (
              // The key includes the state, so each control's form resets after a successful change.
              <AssetRow
                key={`${asset.id}-${asset.isEnabled}-${asset.modelUrl}`}
                asset={asset}
                deployable={exhibit.deployable}
              />
            ))}
          </ul>
        )}
      </section>

      {exhibit.deployable && (
        <section aria-labelledby={`upload-${exhibit.id}`} className="border-t border-black/10 pt-5">
          <h3 id={`upload-${exhibit.id}`} className="mb-3 text-sm font-semibold text-zinc-900">
            Upload a model
          </h3>
          <UploadForm exhibit={exhibit} />
        </section>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------------------------
 * Grid
 * -------------------------------------------------------------------------------------------- */

const FORMAT_BADGE: Record<FormatState, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-600",
  missing: "border-dashed border-zinc-300 bg-white text-zinc-500",
};

function FormatBadge({ exhibit, format }: { exhibit: ArExhibit; format: ArModelFormat }) {
  const state = formatState(exhibit, format);
  const name = format.toUpperCase();
  const text = state === "active" ? name : state === "inactive" ? `${name} off` : `No ${name}`;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${FORMAT_BADGE[state]}`}>{text}</span>
  );
}

function ExhibitTile({
  exhibit,
  onOpenChange,
}: {
  exhibit: ArExhibit;
  onOpenChange: (open: boolean) => void;
}) {
  const name = exhibit.commonName ?? exhibit.scientificName ?? "Unnamed specimen";
  const empty = exhibit.assets.length === 0;

  return (
    <li className="flex min-w-0 flex-col rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-forest-700/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900" title={name}>
            {name}
          </p>
          {exhibit.scientificName && exhibit.commonName && (
            <p className="truncate text-xs italic text-zinc-500">{exhibit.scientificName}</p>
          )}
        </div>
        {!exhibit.deployable && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
            Cleanup only
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <FormatBadge exhibit={exhibit} format="glb" />
        <FormatBadge exhibit={exhibit} format="usdz" />
      </div>

      {usdzOnly(exhibit.assets) && (
        <p className="mt-2 text-xs text-amber-800">iPhone and iPad only: no active GLB.</p>
      )}

      <div className="mt-auto pt-4">
        <ModalButton
          placement="drawer"
          size="lg"
          onOpenChange={onOpenChange}
          title={name}
          description={exhibit.commonName && exhibit.scientificName ? exhibit.scientificName : undefined}
          label={empty && exhibit.deployable ? "Upload model" : "Manage"}
          className={
            empty && exhibit.deployable
              ? "w-full rounded-lg bg-forest-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
              : "w-full rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
          }
        >
          <ExhibitDetails exhibit={exhibit} />
        </ModalButton>
      </div>
    </li>
  );
}

export function ArAssetDeployment({ exhibits }: { exhibits: ArExhibit[] | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ExhibitFilter>("all");
  // The exhibit whose drawer is open stays listed even when a change moves it out of the
  // current filter (e.g. uploading under "No assets"); unmounting it would close the drawer.
  const [openId, setOpenId] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();

  // Counts follow the search, so each chip says how many results it would show.
  const searched = useMemo(() => (exhibits ?? []).filter((exhibit) => matchesQuery(exhibit, needle)), [exhibits, needle]);
  const visible = searched.filter((exhibit) => exhibit.id === openId || EXHIBIT_FILTERS[filter].test(exhibit));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(EXHIBIT_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Panel
      title="AR asset deployment"
      info="Deploy approved 3D models to exhibits the Museum Curator has marked for AR preparation. Every upload, replacement, and activation records the curator authorization in the audit log. The curator controls whether AR is shown on the exhibit page."
    >
      {exhibits === null ? (
        <p role="alert" className="text-sm text-red-700">
          AR exhibits could not be loaded. Reload the page or try again later.
        </p>
      ) : exhibits.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-sage-50 px-4 py-8 text-center">
          <CubeIcon className="h-6 w-6 text-zinc-400" />
          <p className="max-w-md text-sm text-zinc-600">
            No exhibits are ready for AR yet. An exhibit is listed here once the curator marks it for AR preparation in
            Exhibits, and its specimen is Cataloged and approved for public display.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <label className="relative block">
              <span className="sr-only">Search exhibits by name</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by common or scientific name"
                className="w-full rounded-lg border border-black/15 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </label>
            <FilterChips
              label="Filter exhibits by deployed formats"
              chips={(Object.keys(EXHIBIT_FILTERS) as ExhibitFilter[]).map((key) => ({
                label: EXHIBIT_FILTERS[key].label,
                count: searched.filter(EXHIBIT_FILTERS[key].test).length,
                active: filter === key,
                onClick: () => {
                  setFilter(key);
                  setPage(1);
                },
              }))}
            />
          </div>

          {visible.length === 0 ? (
            <p className="mt-4 rounded-lg bg-sage-50 px-3 py-6 text-center text-sm text-zinc-600">
              No exhibits match this search and filter.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {pageItems.map((exhibit) => (
                // Keyed by id only, so an open drawer stays open while the list refreshes.
                <ExhibitTile
                  key={exhibit.id}
                  exhibit={exhibit}
                  onOpenChange={(open) => setOpenId((current) => (open ? exhibit.id : current === exhibit.id ? null : current))}
                />
              ))}
            </ul>
          )}

          {visible.length > 0 && (
            <TablePagination
              className="mt-4"
              label="AR exhibit pages"
              noun="exhibits"
              page={currentPage}
              pageSize={pageSize}
              total={visible.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </Panel>
  );
}
