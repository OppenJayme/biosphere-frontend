/** Synthetic replacement for the remote Server Action; never contacts BioSphere. */
import type { DuplicateCheckInput, DuplicateCheckState } from "../../../src/features/specimens/duplicates";

type PendingRequest = {
  input: DuplicateCheckInput;
  resolve: (result: DuplicateCheckState) => void;
  reject: (error: Error) => void;
};

declare global {
  interface Window {
    duplicateFixture: { requests: PendingRequest[] };
  }
}

window.duplicateFixture = { requests: [] };

export function checkSpecimenDuplicatesAction(input: DuplicateCheckInput): Promise<DuplicateCheckState> {
  return new Promise((resolve, reject) => {
    window.duplicateFixture.requests.push({ input, resolve, reject });
  });
}
