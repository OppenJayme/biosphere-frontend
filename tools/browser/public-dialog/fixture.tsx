import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VisitOptionsSection } from "../../../src/components/visit/VisitOptionsSection";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <button type="button">Background action</button>
    <VisitOptionsSection />
    <a href="#background">Background link</a>
  </StrictMode>,
);
