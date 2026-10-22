/**
 * Structure check for binary glTF (.glb) AR models, shared by the local preview and the upload
 * route. Only self-contained models are accepted: a `uri` pointing at another file or host would
 * make every visitor's browser request it.
 */

import { arFileSizeMessage } from "./form";

const GLB_MAGIC = 0x46546c67; // "glTF"
const GLB_JSON_CHUNK = 0x4e4f534a; // "JSON"
const GLB_HEADER_BYTES = 20; // 12-byte file header + 8-byte header of the first chunk

export const INVALID_GLB = "This file is not a valid binary glTF (.glb) model.";
export const EXTERNAL_GLB_REFERENCES =
  "This model references external files or URLs. Embed its buffers and textures in the .glb before uploading.";

/**
 * Every `uri` in the glTF JSON that is not an embedded data: URI. Any of them would make the
 * loader request another file, so a self-contained GLB has none.
 */
export function externalGltfReferences(json: unknown): string[] {
  const found: string[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (typeof value === "object" && value !== null) {
      for (const [key, child] of Object.entries(value)) {
        if (key === "uri" && (typeof child !== "string" || !child.trim().toLowerCase().startsWith("data:"))) {
          found.push(String(child));
        } else {
          visit(child);
        }
      }
    }
  };
  visit(json);
  return found;
}

/** Reads only the GLB header and JSON chunk; returns the rejection message, or undefined. */
export async function glbFileError(file: File) {
  const sizeMessage = arFileSizeMessage(file);
  if (sizeMessage) return sizeMessage;
  if (file.size < GLB_HEADER_BYTES) return INVALID_GLB;

  const header = new DataView(await file.slice(0, GLB_HEADER_BYTES).arrayBuffer());
  const declaredLength = header.getUint32(8, true);
  const jsonLength = header.getUint32(12, true);
  if (
    header.getUint32(0, true) !== GLB_MAGIC ||
    header.getUint32(4, true) !== 2 ||
    declaredLength > file.size ||
    header.getUint32(16, true) !== GLB_JSON_CHUNK ||
    GLB_HEADER_BYTES + jsonLength > declaredLength
  ) {
    return INVALID_GLB;
  }

  let json: unknown;
  try {
    const bytes = await file.slice(GLB_HEADER_BYTES, GLB_HEADER_BYTES + jsonLength).arrayBuffer();
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return INVALID_GLB;
  }
  return externalGltfReferences(json).length > 0 ? EXTERNAL_GLB_REFERENCES : undefined;
}
