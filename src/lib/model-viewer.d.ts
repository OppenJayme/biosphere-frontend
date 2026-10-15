import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

/** JSX typing for the `<model-viewer>` web component, shared by the exhibit and developer viewers. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
        src?: string;
        "ios-src"?: string;
        alt?: string;
        poster?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "touch-action"?: string;
        "shadow-intensity"?: string;
      };
    }
  }
}
