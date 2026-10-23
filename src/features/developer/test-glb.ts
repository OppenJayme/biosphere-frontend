/** GLB builders for the developer AR tests. */

export const SELF_CONTAINED_GLTF = {
  asset: { version: "2.0" },
  buffers: [{ byteLength: 4 }],
  images: [{ bufferView: 0, mimeType: "image/png" }],
};

/** A GLB with the given JSON chunk and a 4-byte BIN chunk. */
export function glbBytes(json: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = Math.ceil(encoded.length / 4) * 4;
  const total = 12 + 8 + jsonLength + 8 + 4;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(encoded, 20);
  view.setUint32(20 + jsonLength, 4, true);
  view.setUint32(24 + jsonLength, 0x004e4942, true);
  return bytes;
}

export function glbFile(json: unknown = SELF_CONTAINED_GLTF, name = "heron.glb") {
  return new File([glbBytes(json)], name);
}
