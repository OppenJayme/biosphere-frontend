// A single leading "/" not followed by another "/" or a "\" is the only
// shape guaranteed to stay same-origin — "//evil.com" and "/\evil.com" (or
// "/\\evil.com") are both browser-normalized to a protocol-relative URL and
// would otherwise turn a user-supplied `from` param into an open redirect.
const SAFE_INTERNAL_PATH = /^\/(?!\/|\\)/;

export function getSafeRedirect(from: FormDataEntryValue | null, fallback = "/dashboard") {
  return typeof from === "string" && SAFE_INTERNAL_PATH.test(from) ? from : fallback;
}
