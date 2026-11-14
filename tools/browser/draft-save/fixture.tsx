import { createRoot } from "react-dom/client";
import { SpecimenCoreForm } from "../../../src/components/specimens/SpecimenCoreForm";
import { EMPTY_SPECIMEN_FORM_VALUES } from "../../../src/features/specimens/form";

createRoot(document.getElementById("root")!).render(
  <SpecimenCoreForm
    mode={window.location.hash === "#edit" ? "edit" : "create"}
    specimenId="55555555-5555-4555-8555-555555555555"
    collections={[]}
    initialValues={EMPTY_SPECIMEN_FORM_VALUES}
  />,
);
