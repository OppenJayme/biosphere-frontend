/** "Edit taxonomy" opened from the details page, shown as a dialog. */

import { SpecimenTaxonomyForm } from "@/components/specimens/SpecimenTaxonomyForm";
import { RouteModal } from "@/components/ui/RouteModal";
import { taxonomyToFormValues } from "@/features/specimens/taxonomy-form";
import { loadSpecimenForModal, ModalNotice } from "../load-for-modal";

export default async function TaxonomyModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadSpecimenForModal(id, "taxonomy");
  if ("notice" in loaded) return <ModalNotice title="Taxonomy" notice={loaded.notice} />;

  const mode = loaded.detail.taxonomy ? "update" : "create";
  return (
    <RouteModal title={mode === "create" ? "Add taxonomy" : "Edit taxonomy"}>
      <SpecimenTaxonomyForm
        specimenId={id}
        mode={mode}
        initialValues={taxonomyToFormValues(loaded.detail.taxonomy)}
      />
    </RouteModal>
  );
}
