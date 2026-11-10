/** GLB builders for the developer AR tests. */

/** The first 24 bytes of a PNG: signature and IHDR with the given size. */
export function pngHeader(width: number, height: number) {
  const bytes = new Uint8Array(24);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x89504e47);
  view.setUint32(4, 0x0d0a1a0a);
  view.setUint32(8, 13);
  view.setUint32(12, 0x49484452);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

/** One embedded 1×1 PNG texture, stored in the BIN chunk. */
export const SELF_CONTAINED_GLTF = {
  asset: { version: "2.0" },
  buffers: [{ byteLength: 24 }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 24 }],
  images: [{ bufferView: 0, mimeType: "image/png" }],
};

/** A GLB with the given JSON chunk and `bin` (a 1×1 PNG header by default) as its BIN chunk. */
export function glbBytes(json: unknown, bin: Uint8Array = pngHeader(1, 1)) {
  const encoded = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = Math.ceil(encoded.length / 4) * 4;
  const binLength = Math.ceil(bin.length / 4) * 4;
  const total = 12 + 8 + jsonLength + 8 + binLength;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(encoded, 20);
  view.setUint32(20 + jsonLength, binLength, true);
  view.setUint32(24 + jsonLength, 0x004e4942, true);
  bytes.set(bin, 28 + jsonLength);
  return bytes;
}

export function glbFile(json: unknown = SELF_CONTAINED_GLTF, name = "heron.glb", bin?: Uint8Array) {
  return new File([glbBytes(json, bin)], name);
}
