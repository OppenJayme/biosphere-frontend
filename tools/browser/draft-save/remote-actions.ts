/** Only the remote Server Action boundary is replaced; no live data or application config. */
import type { SpecimenFormState } from "../../../src/features/specimens/form";
import type { DuplicateCheckInput, DuplicateCheckState } from "../../../src/features/specimens/duplicates";

declare global {
  interface Window {
    draftSaveFixture: {
      submissions: { mode: string; values: Record<string, FormDataEntryValue> }[];
      requests: { input: DuplicateCheckInput; resolve: (state: DuplicateCheckState) => void }[];
    };
  }
}
window.draftSaveFixture = { submissions: [], requests: [] };

export function checkSpecimenDuplicatesAction(input: DuplicateCheckInput): Promise<DuplicateCheckState> {
  return new Promise(resolve => window.draftSaveFixture.requests.push({ input, resolve }));
}
export async function checkAccessionNumberAction() { return { status: "available" as const }; }
export async function createSpecimenAction(state: SpecimenFormState, data: FormData) {
  window.draftSaveFixture.submissions.push({ mode: "create", values: Object.fromEntries(data) });
  return state;
}
export async function updateSpecimenAction(_id: string, state: SpecimenFormState, data: FormData) {
  window.draftSaveFixture.submissions.push({ mode: "edit", values: Object.fromEntries(data) });
  return state;
}
