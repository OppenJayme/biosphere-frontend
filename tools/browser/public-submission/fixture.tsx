import { createRoot } from "react-dom/client";
import { InquiryForm } from "../../../src/components/inquiry/InquiryForm";
import { RequestVisitForm } from "../../../src/components/visit/RequestVisitForm";
import { VisitOptionsSection } from "../../../src/components/visit/VisitOptionsSection";

createRoot(document.getElementById("root")!).render(
  window.location.pathname === "/dialog" ? (
    <VisitOptionsSection />
  ) : window.location.pathname === "/visit" ? (
    <RequestVisitForm />
  ) : (
    <InquiryForm />
  ),
);
