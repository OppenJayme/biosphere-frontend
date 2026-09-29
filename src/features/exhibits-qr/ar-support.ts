/**
 * Decides, before anything heavy loads, whether this device can show an exhibit's AR model
 * (REQ-4.13-04). Mirrors @google/model-viewer's own AR checks so the "View in AR" action is only
 * offered where model-viewer can actually launch AR:
 * - iOS: AR Quick Look (usdz, or generated from glb)
 * - Android: Google Scene Viewer (glb)
 * - WebXR immersive-ar with hit testing (glb)
 * Nothing here touches the camera; permission is only requested once the visitor starts AR.
 */

import type { PublicArModel } from "./types";

export type ArCapability = "ar" | "3d" | "none";

type XrNavigator = Navigator & {
  xr?: { isSessionSupported(mode: string): Promise<boolean> };
};

function hasWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export async function detectArCapability(models: PublicArModel[]): Promise<ArCapability> {
  const hasGlb = models.some((model) => model.format === "glb");
  const hasUsdz = models.some((model) => model.format === "usdz");
  if (!hasGlb && !hasUsdz) return "none";

  const userAgent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIos) {
    const thirdPartyIosBrowser = /CriOS\/|EdgiOS\/|FxiOS\/|DuckDuckGo\//.test(userAgent);
    const anchor = document.createElement("a");
    const quickLook = thirdPartyIosBrowser || Boolean(anchor.relList?.supports?.("ar"));
    if (quickLook) return "ar";
  }

  if (hasGlb) {
    const sceneViewer = /android/i.test(userAgent) && !/firefox/i.test(userAgent) && !/OculusBrowser/.test(userAgent);
    if (sceneViewer) return "ar";

    const xr = (navigator as XrNavigator).xr;
    if (xr && (await xr.isSessionSupported("immersive-ar").catch(() => false))) return "ar";

    if (hasWebGl()) return "3d";
  }

  return "none";
}
