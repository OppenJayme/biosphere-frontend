/** Developer deployment of approved AR assets for curator-approved exhibits (REQ-4.2-04, REQ-4.2-05). */

"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
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

const AUTHORIZATION_PLACEHOLDER = "e.g. Curator AR approval memo no., approving official, and date";

function exhibitLabel(exhibit: ArExhibit) {
  const name = exhibit.commonName ?? exhibit.scientificName ?? "Unnamed specimen";
  return `${name} — /exhibits/${exhibit.publicSlug}`;
}

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

/** True when visitors would only get a USDZ model, which Android and desktop browsers cannot open. */
function usdzOnly(assets: ArAsset[]) {
  const formats = new Set(assets.filter((asset) => asset.isEnabled).map((asset) => asset.modelFormat));
  return formats.has("usdz") && !formats.has("glb");
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

function UploadForm({ exhibits }: { exhibits: ArExhibit[] }) {
  const { pending, notice, setNotice, upload } = useModelUpload();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ArModelFormat>("glb");
  const [exhibitId, setExhibitId] = useState("");
  // Only an active GLB reaches visitors; an inactive one does not cover Android and desktop.
  const exhibitHasActiveGlb = exhibits
    .find((exhibit) => exhibit.id === exhibitId)
    ?.assets.some((asset) => asset.modelFormat === "glb" && asset.isEnabled);

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
    <section className="rounded-xl border border-black/10 bg-white p-5" aria-labelledby="deploy-heading">
      <h3 id="deploy-heading" className="text-sm font-semibold text-zinc-900">
        Upload AR asset
      </h3>
      <p className="mt-1 text-xs text-zinc-600">
        Single-file GLB or USDZ only, up to 50 MB. The file&apos;s extension and contents must match the
        selected format.
      </p>

      {exhibits.length === 0 ? (
        <p className="mt-4 rounded-lg border border-black/10 bg-sage-50 px-3 py-2 text-sm text-zinc-600">
          No exhibits are ready for AR yet. An exhibit is listed here once the curator marks it for AR
          preparation in Exhibits, and its specimen is Cataloged and approved for public display.
        </p>
      ) : (
        <form
          onSubmit={submit}
          // form.reset() after a successful upload also clears the preview and warning.
          onReset={() => {
            setFile(null);
            setFormat("glb");
            setExhibitId("");
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
            Exhibit marked for AR by the curator
            <select
              name="exhibitId"
              required
              disabled={pending}
              defaultValue=""
              onChange={(event) => setExhibitId(event.target.value)}
              className={inputClasses}
            >
              <option value="" disabled>
                Choose an exhibit…
              </option>
              {exhibits.map((exhibit) => (
                <option key={exhibit.id} value={exhibit.id}>
                  {exhibitLabel(exhibit)}
                </option>
              ))}
            </select>
          </label>
          <FormatSelect disabled={pending} onChange={setFormat} />
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
          {format === "usdz" && exhibitId && !exhibitHasActiveGlb && (
            <div className="sm:col-span-2">
              <UsdzOnlyWarning>
                This exhibit has no active GLB model. A USDZ file only opens on iPhone and iPad, so Android and
                desktop visitors will not see a 3D model. Upload or activate a GLB version as well.
              </UsdzOnlyWarning>
            </div>
          )}
          {file && (
            <div className="sm:col-span-2">
              <ModelFilePreview key={`${file.name}-${file.lastModified}-${file.size}`} file={file} />
            </div>
          )}
          <div className="sm:col-span-2">
            <AuthorizationField
              disabled={pending}
              hint="Recorded in the audit log with this deployment."
            />
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
            <button type="submit" disabled={pending} className={primaryButtonClasses}>
              Upload asset
            </button>
            <PendingOverlay pending={pending} label="Uploading AR asset…" />
            <NoticeLine notice={notice} />
          </div>
        </form>
      )}
    </section>
  );
}

function ActivateControl({ asset }: { asset: ArAsset }) {
  const action = activateArAssetAction.bind(null, asset.id);
  const [state, formAction, pending] = useActionState<ArAssetCommandState, FormData>(action, {});

  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-forest-800 hover:underline">Activate…</summary>
      <form action={formAction} className="mt-2 max-w-sm space-y-2">
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
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-forest-800 hover:underline">
        Replace file…
      </summary>
      <form onSubmit={submit} onReset={() => setFile(null)} className="mt-2 grid max-w-md gap-2">
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
          <button type="submit" disabled={pending} className={outlineButtonClasses}>
            Replace file
          </button>
          <PendingOverlay pending={pending} label="Replacing AR model…" />
          <NoticeLine notice={notice} />
        </div>
      </form>
    </details>
  );
}

function AssetRow({ asset, deployable }: { asset: ArAsset; deployable: boolean }) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-zinc-900" title={asset.id}>
          {asset.id}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          <span className="uppercase">{asset.modelFormat}</span>
          {" · "}
          {asset.isEnabled ? (
            <span className="font-semibold text-emerald-700">Active</span>
          ) : (
            <span className="text-zinc-500">Inactive</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        {!asset.isEnabled && deployable && <ActivateControl asset={asset} />}
        {asset.isEnabled && <DeactivateControl asset={asset} />}
        {deployable && <ReplaceControl asset={asset} />}
        <RemoveControl asset={asset} />
      </div>
    </li>
  );
}

function ExhibitCard({ exhibit }: { exhibit: ArExhibit }) {
  return (
    <li className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">
            {exhibit.commonName ?? "Unnamed specimen"}
            {exhibit.scientificName && (
              <span className="ml-2 text-sm font-normal italic text-zinc-500">{exhibit.scientificName}</span>
            )}
          </p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">/exhibits/{exhibit.publicSlug}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold capitalize text-zinc-600 ring-1 ring-zinc-200">
            {exhibit.status.toLowerCase()}
          </span>
          {!exhibit.deployable && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Cleanup only
            </span>
          )}
        </div>
      </div>

      {exhibit.arSelected && exhibit.arSelectionNote && (
        <p className="mt-2 rounded-lg bg-sage-50 px-3 py-2 text-xs whitespace-pre-line text-zinc-700">
          <span className="font-semibold">Curator&apos;s reason: </span>
          {exhibit.arSelectionNote}
        </p>
      )}

      {!exhibit.deployable && (
        <p className="mt-2 text-xs text-amber-900">
          {exhibit.archived
            ? "This exhibit is archived."
            : !exhibit.arSelected
              ? "The curator withdrew this exhibit's AR selection."
              : "This exhibit is no longer approved for public display."}{" "}
          Its assets can only be deactivated or removed.
        </p>
      )}

      {usdzOnly(exhibit.assets) && (
        <div className="mt-2">
          <UsdzOnlyWarning>
            Only a USDZ model is active, so the 3D model opens on iPhone and iPad only. Deploy a GLB version
            so Android and desktop visitors can view it too.
          </UsdzOnlyWarning>
        </div>
      )}

      {exhibit.assets.length === 0 ? (
        <p className="mt-3 text-xs text-zinc-500">No AR asset deployed yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-black/5">
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
    </li>
  );
}

export function ArAssetDeployment({ exhibits }: { exhibits: ArExhibit[] | null }) {
  return (
    <section className="space-y-4" aria-labelledby="ar-deployment-heading">
      <div>
        <h2 id="ar-deployment-heading" className="font-serif text-lg font-semibold text-forest-800">
          AR asset deployment
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Deploy approved 3D models to exhibits the Museum Curator has marked for AR preparation. Every
          upload, replacement, and activation records the curator authorization in the audit log. The
          curator controls whether AR is shown on the exhibit page.
        </p>
      </div>

      {exhibits === null ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          AR exhibits could not be loaded. Reload the page or try again later.
        </p>
      ) : (
        <>
          <UploadForm exhibits={exhibits.filter((exhibit) => exhibit.deployable)} />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Exhibits and deployed assets</h3>
            {exhibits.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No exhibits are marked for AR and no assets are deployed.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {exhibits.map((exhibit) => (
                  <ExhibitCard key={exhibit.id} exhibit={exhibit} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
