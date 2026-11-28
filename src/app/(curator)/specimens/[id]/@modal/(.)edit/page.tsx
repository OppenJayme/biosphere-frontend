/** "Edit basic details" opened from the details page, shown as a dialog. */

import { SpecimenCoreForm } from "@/components/specimens/SpecimenCoreForm";
import { RouteModal } from "@/components/ui/RouteModal";
import { listCollections } from "@/features/specimens/api";
import { specimenToFormValues } from "@/features/specimens/form";
import { loadSpecimenForModal, ModalNotice } from "../load-for-modal";

const TITLE = "Edit basic details";

export default async function EditSpecimenModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [loaded, collections] = await Promise.all([
    loadSpecimenForModal(id, "edit"),
    listCollections().catch(() => null),
  ]);
  if ("notice" in loaded) return <ModalNotice title={TITLE} notice={loaded.notice} />;
  if (!collections) {
    return (
      <ModalNotice
        title={TITLE}
        notice="Collections could not be loaded, so the editor is unavailable. Existing data has not been changed."
      />
    );
  }

  return (
    <RouteModal title={TITLE}>
      <SpecimenCoreForm
        mode="edit"
        specimenId={id}
        collections={collections}
        initialValues={specimenToFormValues(loaded.detail.specimen)}
      />
    </RouteModal>
  );
}
