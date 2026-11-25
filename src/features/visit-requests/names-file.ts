/**
 * Optional "fill names from a file" for the public visit request form. The file is read in the
 * visitor's browser and only fills the visitor name rows, which the visitor reviews before sending.
 * It is never uploaded or stored. Supports plain text, Word (.docx) and text-based PDF.
 */

export const NAMES_FILE_ACCEPT =
  ".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Large enough for a long class list with formatting, small enough to read quickly on a phone. */
export const NAMES_FILE_MAX_BYTES = 5 * 1024 * 1024;

export type VisitorName = { firstName: string; lastName: string };

export type NamesFileResult =
  | { ok: true; names: VisitorName[]; skipped: number }
  | { ok: false; message: string };

/** Lines that are list furniture rather than a person: headings and column titles. */
const HEADING_WORDS = new Set([
  "name", "names", "first", "last", "full", "given", "middle", "surname", "family", "no", "no.", "#",
  "visitor", "visitors", "list", "of", "the", "participant", "participants", "student", "students",
  "attendee", "attendees", "member", "members", "guest", "guests", "and", "initial", "mi", "m.i.",
]);

/** Lowercase connectors that belong to the last name, as in "Juan dela Cruz" or "Ana de los Santos". */
const SURNAME_PARTICLES = new Set([
  "de", "del", "dela", "della", "delos", "des", "di", "da", "dos", "do", "du", "la", "las", "le",
  "los", "san", "santa", "sta", "sta.", "sto", "sto.", "van", "von", "der", "den", "y",
]);

const SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv|v|vi)$/i;

/**
 * Words that mark a line as part of the document around the list (school name, grade, sign-off)
 * rather than a visitor. Lists are reviewed before sending, so a rare real name caught here is
 * simply typed in.
 */
const NON_NAME_WORDS = new Set([
  "school", "high", "university", "college", "academy", "institute", "elementary", "grade", "section",
  "class", "department", "prepared", "noted", "approved", "checked", "adviser", "advisor", "teacher",
  "coordinator", "principal", "signed", "signature", "date", "subject", "trip", "page", "total",
  "museum", "by", "inc", "inc.", "corp", "corp.", "foundation", "organization", "office",
]);

/** A title before a name, as in "Mr. Juan Cruz" or "Ma'am Ana Reyes". */
const HONORIFIC = /^(?:mr|mrs|ms|miss|mx|dr|engr|atty|prof|sir|ma'?am|fr|sr|rev|hon)\.?\s+/i;

function looksLikeNonName(line: string) {
  if (/\d/.test(line) || line.includes(":")) return true;
  return line
    .toLowerCase()
    .split(/[\s,()/]+/)
    .some((word) => NON_NAME_WORDS.has(word));
}

/** Removes list numbering and bullets: "1.", "12)", "(3)", "4 -", "-", "*", "•". */
function stripListMarker(line: string) {
  return line.replace(/^\s*(?:\(?\d{1,4}[.)]|\d{1,4}\s+-|[-*•‣◦▪●·–—])\s*/u, "").trim();
}

function isHeading(line: string) {
  const words = line.toLowerCase().replace(/[:.,()/\\-]+/g, " ").split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => HEADING_WORDS.has(word));
}

function titleTrim(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[,;\s]+|[,;\s]+$/g, "");
}

/**
 * Splits one person's name into first and last name. "Last, First" is understood; otherwise the
 * last word is the last name, together with any surname particles before it and a trailing suffix.
 * A single word becomes the first name only, so the visitor is asked for the last name.
 */
export function splitVisitorName(raw: string): VisitorName | null {
  const line = titleTrim(raw);
  if (!/\p{L}/u.test(line)) return null;

  const comma = line.split(",").map((part) => titleTrim(part)).filter(Boolean);
  if (comma.length === 2 && !SUFFIX.test(comma[1])) {
    return { firstName: comma[1], lastName: comma[0] };
  }
  if (comma.length === 3 && SUFFIX.test(comma[1])) {
    // "Dela Cruz, Jr., Juan"
    return { firstName: comma[2], lastName: `${comma[0]} ${comma[1]}` };
  }

  const words = line.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 1) return { firstName: words[0], lastName: "" };

  let end = words.length;
  const suffix = SUFFIX.test(words[end - 1]) && end > 2 ? words[--end] : undefined;
  let start = end - 1;
  while (start > 1 && SURNAME_PARTICLES.has(words[start - 1].toLowerCase())) start -= 1;
  const lastName = [...words.slice(start, end), ...(suffix ? [suffix] : [])].join(" ");
  return { firstName: words.slice(0, start).join(" "), lastName };
}

/**
 * Reads one name per line (or per table row, with cells separated by tabs). Headings, numbering,
 * blank lines and lines that read like sentences are skipped and counted.
 */
export function namesFromText(text: string): { names: VisitorName[]; skipped: number } {
  const names: VisitorName[] = [];
  let skipped = 0;
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    let cells = rawLine.split("\t").map(stripListMarker).filter(Boolean);
    // A leading number cell ("1 | Juan | Dela Cruz") is a row number, not part of the name.
    if (cells.length > 1 && /^\d+[.)]?$/.test(cells[0])) cells = cells.slice(1);
    cells = cells.map((cell) => cell.replace(HONORIFIC, ""));
    const line = cells.join(" ");
    if (!line) continue;
    if (isHeading(line)) {
      skipped += 1;
      continue;
    }
    const words = line.split(/\s+/);
    // Sentences ("Here is our class list"), school names, sign-offs and over-long lines are not names.
    if (/[?!]$/.test(line) || words.length > 7 || line.length > 120 || looksLikeNonName(line)) {
      skipped += 1;
      continue;
    }
    // A two-cell table row is First | Last, as the form itself asks.
    const name =
      cells.length === 2 && !cells[0].includes(",")
        ? { firstName: titleTrim(cells[0]), lastName: titleTrim(cells[1]) }
        : splitVisitorName(line);
    if (name) names.push(name);
    else skipped += 1;
  }
  return { names, skipped };
}

function decodeXmlText(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
  });
}

/** The body text of word/document.xml: one line per paragraph, table cells separated by tabs. */
export function documentXmlText(xml: string): string {
  const lines: string[] = [];
  let paragraph = "";
  let cell: string[] | null = null;
  let row: string[] | null = null;
  let inText = false;
  const tag = /<(\/?)(w:p|w:tr|w:tc|w:t|w:tab|w:br|w:cr)\b[^>]*?(\/?)>|([^<]+)|<[^>]*>/g;
  for (const match of xml.matchAll(tag)) {
    const [, closing, name, selfClosing, text] = match;
    if (text !== undefined) {
      if (inText) paragraph += decodeXmlText(text);
      continue;
    }
    if (!name) continue;
    if (name === "w:t") inText = !closing && !selfClosing;
    else if (name === "w:tab" && !closing) paragraph += "\t";
    else if ((name === "w:br" || name === "w:cr") && !closing) paragraph += "\n";
    else if (name === "w:p" && (closing || selfClosing)) {
      if (cell) cell.push(paragraph);
      else lines.push(paragraph);
      paragraph = "";
    } else if (name === "w:tc") {
      if (!closing && !selfClosing) cell = [];
      else if (cell) {
        row?.push(cell.join(" ").trim());
        cell = null;
      }
    } else if (name === "w:tr") {
      if (!closing && !selfClosing) row = [];
      else if (row) {
        lines.push(row.join("\t"));
        row = null;
      }
    }
  }
  if (paragraph) lines.push(paragraph);
  return lines.join("\n");
}

/** Finds one entry in a ZIP (a .docx) and returns its bytes, inflating it if needed. */
async function zipEntry(bytes: Uint8Array, wanted: string): Promise<Uint8Array | null> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The end-of-central-directory record is in the last 64 KB + 22 bytes.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  for (let i = 0; i < count && offset + 46 <= bytes.length; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) return null;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;
    if (name !== wanted) continue;

    if (view.getUint32(localOffset, true) !== 0x04034b50) return null;
    const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
    const data = bytes.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) return data;
    if (method !== 8) return null;
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return null;
}

export async function docxText(bytes: Uint8Array): Promise<string | null> {
  const xml = await zipEntry(bytes, "word/document.xml");
  return xml ? documentXmlText(new TextDecoder().decode(xml)) : null;
}

/** Plain text in UTF-8 or UTF-16 (Notepad's "Unicode"), with or without a byte order mark. */
export function plainText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  return new TextDecoder().decode(bytes).replace(/^﻿/, "");
}

type FileKind = "txt" | "docx" | "pdf";

function kindOf(file: File, bytes: Uint8Array): FileKind | null {
  const extension = file.name.toLowerCase().split(".").pop();
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isPdf = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (extension === "docx" && isZip) return "docx";
  if (extension === "pdf" && isPdf) return "pdf";
  if (extension === "txt" && !isZip && !isPdf) return "txt";
  return null;
}

export async function readNamesFile(
  file: File,
  readPdf: (bytes: Uint8Array) => Promise<string> = async (bytes) =>
    (await import("./names-file-pdf")).pdfText(bytes),
): Promise<NamesFileResult> {
  if (file.size === 0) return { ok: false, message: "That file is empty." };
  if (file.size > NAMES_FILE_MAX_BYTES) {
    return { ok: false, message: "That file is larger than 5 MB. Use a shorter list, or type the names." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = kindOf(file, bytes);
  if (!kind) {
    return {
      ok: false,
      message: "Use a .txt, .docx or .pdf file. Older .doc files can be saved as .docx in Word first.",
    };
  }

  let text: string | null;
  try {
    text = kind === "txt" ? plainText(bytes) : kind === "docx" ? await docxText(bytes) : await readPdf(bytes);
  } catch {
    text = null;
  }
  if (text === null) {
    return { ok: false, message: "That file could not be read. Save it again, or type the names." };
  }

  const { names, skipped } = namesFromText(text);
  if (names.length === 0) {
    return {
      ok: false,
      message:
        kind === "pdf"
          ? "No names were found. A scanned PDF has no text to read, so use a .txt or .docx file, or type the names."
          : "No names were found. Put one name on each line, or type the names.",
    };
  }
  return { ok: true, names, skipped };
}
