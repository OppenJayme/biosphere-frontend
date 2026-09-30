/** Developer deployment of approved AR assets for curator-approved exhibits (REQ-4.2-04, REQ-4.2-05). */

"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  removeArAssetAction,
  setArAssetEnabledAction,
  type ArAssetCommandResult,
} from "@/features/developer/actions";
import {
  AR_ASSET_ACCEPT,
  firstValidationMessage,
  readArAssetCreateForm,
  readArAssetReplaceForm,
} from "@/features/developer/form";
import { AR_MODEL_FORMATS, arAssetSchema, type ArAsset } from "@/features/developer/types";

type Notice = { tone: "success" | "error"; message: string };

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const primaryButtonClasses =
  "rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const outlineButtonClasses =
  "rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60";

const dangerButtonClasses =
  "rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

const AUTHORIZATION_LABEL =
  "I confirm the Museum Curator approved this exhibit for AR and this asset's use is documented as authorized.";

function NoticeLine({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return notice.tone === "error" ? (
    <p role="alert" className="mt-3 text-xs font-medium text-red-700">
      {notice.message}
    </p>
  ) : (
    <p role="status" className="mt-3 text-xs font-medium text-emerald-700">
      {notice.message}
    </p>
  );
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

function FormatSelect({ disabled }: { disabled: boolean }) {
  return (
    <label className="text-xs font-medium text-zinc-700">
      Model format
      <select name="modelFormat" required disabled={disabled} defaultValue="glb" className={inputClasses}>
        {AR_MODEL_FORMATS.map((format) => (
          <option key={format} value={format}>
            {format.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuthorizationCheckbox({ disabled }: { disabled: boolean }) {
  return (
    <label className="flex items-start gap-2 text-xs text-zinc-700">
      <input
        type="checkbox"
        name="authorizationConfirmed"
        required
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 accent-forest-700"
      />
      {AUTHORIZATION_LABEL}
    </label>
  );
}

/** Upload a new asset or replace an existing asset's file through the same-origin route. */
function useUpload(onDeployed: (asset: ArAsset) => void) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function upload(form: HTMLFormElement, method: "POST" | "PUT", success: string) {
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
      onDeployed(result.data);
      setNotice({ tone: "success", message: success });
    } catch {
      setNotice({ tone: "error", message: "The upload failed. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return { pending, notice, setNotice, upload };
}

function DeployForm({ onDeployed }: { onDeployed: (asset: ArAsset) => void }) {
  const { pending, notice, setNotice, upload } = useUpload(onDeployed);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const parsed = readArAssetCreateForm(new FormData(form));
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstValidationMessage(parsed.error) });
      return;
    }
    void upload(
      form,
      "POST",
      parsed.data.isEnabled
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
        Single-file GLB or USDZ only, up to 50 MB. The file&apos;s extension and contents must match
        the selected format.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
          Exhibit ID (from the curator)
          <input
            name="exhibitId"
            required
            disabled={pending}
            autoComplete="off"
            spellCheck={false}
            placeholder="00000000-0000-0000-0000-000000000000"
            className={`${inputClasses} font-mono`}
          />
        </label>
        <FormatSelect disabled={pending} />
        <label className="text-xs font-medium text-zinc-700">
          Model file
          <input
            type="file"
            name="file"
            accept={AR_ASSET_ACCEPT}
            required
            disabled={pending}
            className={`${inputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-forest-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-forest-800`}
          />
        </label>
        <div className="space-y-2 sm:col-span-2">
          <AuthorizationCheckbox disabled={pending} />
          <label className="flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              name="isEnabled"
              disabled={pending}
              className="h-4 w-4 rounded border-black/20 accent-forest-700"
            />
            Activate immediately (otherwise the asset is deployed inactive)
          </label>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={primaryButtonClasses}>
            Upload asset
          </button>
          <PendingOverlay pending={pending} label="Uploading AR asset…" />
          <NoticeLine notice={notice} />
        </div>
      </form>
    </section>
  );
}

function ManageAssetForm({
  assetId,
  onAssetIdChange,
  onDeployed,
  onCommand,
  commandPending,
  commandNotice,
}: {
  assetId: string;
  onAssetIdChange: (value: string) => void;
  onDeployed: (asset: ArAsset) => void;
  onCommand: (command: "activate" | "deactivate" | "remove", id: string) => void;
  commandPending: boolean;
  commandNotice: Notice | null;
}) {
  const { pending, notice, setNotice, upload } = useUpload(onDeployed);
  const assetInputId = useId();
  const busy = pending || commandPending;
  const trimmed = assetId.trim();

  function replace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const parsed = readArAssetReplaceForm(new FormData(form));
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstValidationMessage(parsed.error) });
      return;
    }
    void upload(form, "PUT", "The AR asset file was replaced. Its active state is unchanged.");
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5" aria-labelledby="manage-heading">
      <h3 id="manage-heading" className="text-sm font-semibold text-zinc-900">
        Manage existing AR asset
      </h3>
      <p className="mt-1 text-xs text-zinc-600">
        Enter the asset ID returned when it was uploaded, or pick one from the list below.
      </p>

      <label htmlFor={assetInputId} className="mt-4 block text-xs font-medium text-zinc-700">
        AR asset ID
      </label>
      <input
        id={assetInputId}
        value={assetId}
        onChange={(event) => onAssetIdChange(event.target.value)}
        disabled={busy}
        autoComplete="off"
        spellCheck={false}
        placeholder="00000000-0000-0000-0000-000000000000"
        className={`${inputClasses} font-mono`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <ConfirmButton
          label="Activate"
          question="Activate this AR asset?"
          detail="Only activate an asset that passed technical review and whose use is documented as authorized. Visitors can then open it from the exhibit page, if the curator has AR switched on."
          confirmLabel="Yes, activate"
          disabled={busy || !trimmed}
          pending={commandPending}
          pendingLabel="Updating AR asset…"
          className={outlineButtonClasses}
          onConfirm={() => onCommand("activate", trimmed)}
        />
        <ConfirmButton
          label="Deactivate"
          question="Deactivate this AR asset?"
          detail="Visitors will no longer be offered this AR model. The exhibit page keeps its non-AR view."
          confirmLabel="Yes, deactivate"
          disabled={busy || !trimmed}
          pending={commandPending}
          pendingLabel="Updating AR asset…"
          className={outlineButtonClasses}
          onConfirm={() => onCommand("deactivate", trimmed)}
        />
        <ConfirmButton
          label="Remove"
          question="Remove this AR asset?"
          detail="The asset record and its stored model file are deleted. This cannot be undone; you would need to upload the model again."
          confirmLabel="Yes, remove"
          tone="danger"
          disabled={busy || !trimmed}
          pending={commandPending}
          pendingLabel="Removing AR asset…"
          className={dangerButtonClasses}
          onConfirm={() => onCommand("remove", trimmed)}
        />
      </div>
      <NoticeLine notice={commandNotice} />

      <details className="mt-4 border-t border-black/5 pt-4">
        <summary className="cursor-pointer text-xs font-semibold text-forest-800">Replace model file</summary>
        <form onSubmit={replace} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="assetId" value={trimmed} />
          <FormatSelect disabled={busy} />
          <label className="text-xs font-medium text-zinc-700">
            Replacement file
            <input
              type="file"
              name="file"
              accept={AR_ASSET_ACCEPT}
              required
              disabled={busy}
              className={`${inputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-forest-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-forest-800`}
            />
          </label>
          <div className="sm:col-span-2">
            <AuthorizationCheckbox disabled={busy} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy || !trimmed} className={primaryButtonClasses}>
              Replace file
            </button>
            <PendingOverlay pending={pending} label="Replacing AR model…" />
            <NoticeLine notice={notice} />
          </div>
        </form>
      </details>
    </section>
  );
}

function SessionAssets({ assets, onSelect }: { assets: ArAsset[]; onSelect: (id: string) => void }) {
  if (assets.length === 0) return null;

  return (
    <section className="overflow-x-auto rounded-xl border border-black/10 bg-white" aria-labelledby="session-assets-heading">
      <h3 id="session-assets-heading" className="px-4 pt-4 text-sm font-semibold text-zinc-900">
        AR assets changed in this session
      </h3>
      <p className="px-4 pt-1 text-xs text-zinc-500">
        Copy the asset IDs somewhere safe. This list clears when you leave the page.
      </p>
      <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
        <thead className="border-y border-black/10 bg-sage-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">Asset ID</th>
            <th scope="col" className="px-4 py-2 font-semibold">Exhibit ID</th>
            <th scope="col" className="px-4 py-2 font-semibold">Format</th>
            <th scope="col" className="px-4 py-2 font-semibold">State</th>
            <th scope="col" className="px-4 py-2 font-semibold"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 py-2 font-mono text-xs text-zinc-900">{asset.id}</td>
              <td className="px-4 py-2 font-mono text-xs text-zinc-600">{asset.exhibitId}</td>
              <td className="px-4 py-2 text-xs uppercase text-zinc-600">{asset.modelFormat}</td>
              <td className="px-4 py-2 text-xs">
                {asset.isEnabled ? (
                  <span className="font-semibold text-emerald-700">Active</span>
                ) : (
                  <span className="text-zinc-500">Inactive</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(asset.id)}
                  className="text-xs font-semibold text-forest-800 hover:underline"
                >
                  Manage
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ArAssetDeployment() {
  const [assets, setAssets] = useState<ArAsset[]>([]);
  const [assetId, setAssetId] = useState("");
  const [commandNotice, setCommandNotice] = useState<Notice | null>(null);
  const [commandPending, startCommand] = useTransition();

  function remember(asset: ArAsset) {
    setAssets((current) => [asset, ...current.filter((existing) => existing.id !== asset.id)]);
  }

  function runCommand(command: "activate" | "deactivate" | "remove", id: string) {
    setCommandNotice(null);
    startCommand(async () => {
      let result: ArAssetCommandResult;
      try {
        result =
          command === "remove"
            ? await removeArAssetAction(id)
            : await setArAssetEnabledAction(id, command === "activate");
      } catch {
        setCommandNotice({ tone: "error", message: "The request failed. Check your connection and try again." });
        return;
      }

      if (!result.ok) {
        setCommandNotice({ tone: "error", message: result.message });
      } else if ("removedId" in result) {
        setAssets((current) => current.filter((asset) => asset.id !== result.removedId));
        setAssetId("");
        setCommandNotice({ tone: "success", message: "The AR asset and its model file were removed." });
      } else {
        remember(result.asset);
        setCommandNotice({
          tone: "success",
          message: result.asset.isEnabled ? "The AR asset is now active." : "The AR asset is now inactive.",
        });
      }
    });
  }

  return (
    <section className="space-y-4" aria-labelledby="ar-deployment-heading">
      <div>
        <h2 id="ar-deployment-heading" className="font-serif text-lg font-semibold text-forest-800">
          AR asset deployment
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Deploy approved 3D models to exhibits the Museum Curator has approved for AR. The curator
          controls whether AR is shown on the exhibit page.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DeployForm
          onDeployed={(asset) => {
            remember(asset);
            setAssetId(asset.id);
          }}
        />
        <ManageAssetForm
          assetId={assetId}
          onAssetIdChange={setAssetId}
          onDeployed={remember}
          onCommand={runCommand}
          commandPending={commandPending}
          commandNotice={commandNotice}
        />
      </div>

      <SessionAssets
        assets={assets}
        onSelect={(id) => {
          setAssetId(id);
          setCommandNotice(null);
        }}
      />
    </section>
  );
}
