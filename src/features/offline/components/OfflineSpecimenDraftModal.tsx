"use client";

import { useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Field, fieldClasses } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import { draftFromFormData } from "../schema";
import { SPECIMEN_GENDERS } from "../types";
import type { OfflineSpecimenDraft, SpecimenDraftData } from "../types";

const GENDER_LABELS = {
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "Unknown",
  NOT_APPLICABLE: "Not applicable",
} as const;

export function OfflineSpecimenDraftModal({
  draft,
  onClose,
  onSave,
}: {
  draft: OfflineSpecimenDraft | null;
  onClose: () => void;
  onSave: (data: SpecimenDraftData, clientDraftId?: string) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const data = draftFromFormData(new FormData(formRef.current));
      await onSave(data, draft?.clientDraftId);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const values = draft?.draft;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start gap-4 border-b border-black/10 px-6 py-4">
          <div>
            <h2 className="font-semibold text-zinc-900">
              {draft ? "Edit offline specimen draft" : "New offline specimen draft"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              This saves text-only core details on this device. Collection assignment,
              taxonomy, provenance, lots, storage, media, QR, and publishing remain
              online-only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto shrink-0 text-zinc-400 hover:text-zinc-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Until synchronization succeeds, this is a local draft—not a confirmed museum
            database record.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="offline-accessionNumber"
              name="accessionNumber"
              label="Accession number"
              maxLength={100}
              defaultValue={values?.accessionNumber ?? ""}
              placeholder="May be left blank until confirmed"
            />
            <TextField
              id="offline-specimenCategory"
              name="specimenCategory"
              label="Specimen category"
              maxLength={100}
              defaultValue={values?.specimenCategory ?? ""}
              placeholder="e.g. Reptile"
            />
            <TextField
              id="offline-commonName"
              name="commonName"
              label="Common name"
              maxLength={255}
              defaultValue={values?.commonName ?? ""}
              placeholder="e.g. Ball Python"
            />
            <TextField
              id="offline-scientificName"
              name="scientificName"
              label="Scientific name"
              maxLength={255}
              defaultValue={values?.scientificName ?? ""}
              placeholder="e.g. Python regius"
            />
            <Field label="Gender" htmlFor="offline-gender">
              <select
                id="offline-gender"
                name="gender"
                defaultValue={values?.gender ?? ""}
                className={fieldClasses}
              >
                <option value="">Not recorded</option>
                {SPECIMEN_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {GENDER_LABELS[gender]}
                  </option>
                ))}
              </select>
            </Field>
            <TextField
              id="offline-classificationStatus"
              name="classificationStatus"
              label="Classification status"
              defaultValue={values?.classificationStatus ?? ""}
              placeholder="Curator-entered classification note"
            />
          </div>

          <Field label="Remarks" htmlFor="offline-remarks">
            <textarea
              id="offline-remarks"
              name="remarks"
              rows={4}
              defaultValue={values?.remarks ?? ""}
              className={`${fieldClasses} resize-y`}
              placeholder="Text-only notes"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-black/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save on this device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
