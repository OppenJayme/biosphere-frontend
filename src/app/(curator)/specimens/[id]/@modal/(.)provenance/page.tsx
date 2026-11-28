/** "Edit provenance" opened from the details page, shown as a dialog. */

import { SpecimenProvenanceForm } from "@/components/specimens/SpecimenProvenanceForm";
import { RouteModal } from "@/components/ui/RouteModal";
import { provenanceToFormValues } from "@/features/specimens/provenance-form";
import { loadSpecimenForModal, ModalNotice } from "../load-for-modal";

export default async function ProvenanceModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadSpecimenForModal(id, "provenance");
  if ("notice" in loaded) return <ModalNotice title="Provenance" notice={loaded.notice} />;

  const mode = loaded.detail.provenance ? "update" : "create";
  return (
    <RouteModal title={mode === "create" ? "Add provenance" : "Edit provenance"}>
      <SpecimenProvenanceForm
        specimenId={id}
        mode={mode}
        initialValues={provenanceToFormValues(loaded.detail.provenance)}
      />
    </RouteModal>
  );
}
