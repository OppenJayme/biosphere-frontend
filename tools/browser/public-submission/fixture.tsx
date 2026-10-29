import { createRoot } from "react-dom/client";
import { InquiryForm } from "../../../src/components/inquiry/InquiryForm";
import { RequestVisitForm } from "../../../src/components/visit/RequestVisitForm";

createRoot(document.getElementById("root")!).render(
  window.location.pathname === "/visit" ? (
    <RequestVisitForm />
  ) : (
    <InquiryForm />
  ),
);
