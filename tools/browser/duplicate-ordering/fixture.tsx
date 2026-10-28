import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { SpecimenDuplicateCheck } from "../../../src/components/specimens/SpecimenDuplicateCheck";

function Fixture() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
      <label>Common name<input name="commonName" /></label>
      <label>Scientific name<input name="scientificName" /></label>
      <label>Accession number<input name="accessionNumber" /></label>
      <label>Remarks<input name="remarks" /></label>
      <button type="submit">Save fixture</button>
      <SpecimenDuplicateCheck formRef={formRef} />
    </form>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
