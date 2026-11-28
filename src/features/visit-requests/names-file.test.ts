import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  NAMES_FILE_MAX_BYTES,
  docxText,
  documentXmlText,
  namesFromText,
  plainText,
  readNamesFile,
  splitVisitorName,
} from "./names-file";

const encoder = new TextEncoder();

/** A minimal ZIP holding the given entries, deflated like Word saves them. */
async function zip(entries: Record<string, string>): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = encoder.encode(name);
    const raw = encoder.encode(content);
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const data = new Uint8Array(await new Response(stream).arrayBuffer());
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(8, 8, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, nameBytes.length, true);
    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true);
    header.setUint16(10, 8, true);
    header.setUint32(20, data.length, true);
    header.setUint32(24, raw.length, true);
    header.setUint16(28, nameBytes.length, true);
    header.setUint32(42, offset, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, data);
    central.push(new Uint8Array(header.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(entries).length, true);
  end.setUint16(10, Object.keys(entries).length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of all) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const para = (text: string) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const cell = (text: string) => `<w:tc><w:tcPr/>${para(text)}</w:tc>`;
const documentXml = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;

function file(name: string, content: Uint8Array | string) {
  return new File([typeof content === "string" ? encoder.encode(content) : (content as BlobPart)], name);
}

describe("splitVisitorName", () => {
  it.each([
    ["Juan Dela Cruz", "Juan", "Dela Cruz"],
    ["juan dela cruz", "juan", "dela cruz"],
    ["Ana de los Santos", "Ana", "de los Santos"],
    ["Maria Clara Santos", "Maria Clara", "Santos"],
    ["Maria C. Santos", "Maria C.", "Santos"],
    ["Pedro San Juan", "Pedro", "San Juan"],
    ["Jose Rizal Jr.", "Jose", "Rizal Jr."],
    ["Juan Dela Cruz III", "Juan", "Dela Cruz III"],
    ["Dela Cruz, Juan", "Juan", "Dela Cruz"],
    ["Santos, Maria Clara", "Maria Clara", "Santos"],
    ["Dela Cruz, Jr., Juan", "Juan", "Dela Cruz Jr."],
    ["  Ana   Reyes  ", "Ana", "Reyes"],
  ])("%s", (raw, firstName, lastName) => {
    expect(splitVisitorName(raw)).toEqual({ firstName, lastName });
  });

  it("keeps a single word as the first name, so the visitor adds the last name", () => {
    expect(splitVisitorName("Ana")).toEqual({ firstName: "Ana", lastName: "" });
  });

  it("ignores lines without letters", () => {
    expect(splitVisitorName("12345")).toBeNull();
  });
});

describe("namesFromText", () => {
  it("reads one name per line, skipping headings, numbering, blanks and sentences", () => {
    const text = [
      "List of Visitors",
      "Here is our class list:",
      "",
      "1. Juan Dela Cruz",
      "2) Maria Santos",
      "• Ana Reyes",
      "- Ben Cruz",
      "Name",
      "This line is a sentence that is far too long to be anyone's name at all",
    ].join("\r\n");
    expect(namesFromText(text)).toEqual({
      names: [
        { firstName: "Juan", lastName: "Dela Cruz" },
        { firstName: "Maria", lastName: "Santos" },
        { firstName: "Ana", lastName: "Reyes" },
        { firstName: "Ben", lastName: "Cruz" },
      ],
      skipped: 4,
    });
  });

  it("skips the document around a class list and strips titles from names", () => {
    const text = [
      "Cebu Science High School",
      "Grade 8 - Section Rizal",
      "Biology field trip",
      "Date: November 30",
      "1. Mr. Carlo Mendoza",
      "2. Ma'am Grace Tan",
      "3. Dr. Paolo San Juan",
      "Prepared by Ms. Lopez, adviser",
      "Noted by the principal",
    ].join("\n");
    expect(namesFromText(text)).toEqual({
      names: [
        { firstName: "Carlo", lastName: "Mendoza" },
        { firstName: "Grace", lastName: "Tan" },
        { firstName: "Paolo", lastName: "San Juan" },
      ],
      skipped: 6,
    });
  });

  it("treats two table cells as first and last name, after a row number", () => {
    const text = "No.\tFirst Name\tLast Name\n1\tMaria Clara\tDe la Paz\n2\tJose\tRizal";
    expect(namesFromText(text).names).toEqual([
      { firstName: "Maria Clara", lastName: "De la Paz" },
      { firstName: "Jose", lastName: "Rizal" },
    ]);
  });
});

describe("documentXmlText", () => {
  it("returns paragraphs as lines and table rows as tab-separated cells", () => {
    const xml = documentXml(
      para("Visitors") +
        `<w:tbl><w:tr>${cell("Juan")}${cell("Dela Cruz")}</w:tr><w:tr>${cell("Ana")}${cell("Reyes &amp; Co")}</w:tr></w:tbl>` +
        para("Ben Cruz"),
    );
    expect(documentXmlText(xml)).toBe("Visitors\nJuan\tDela Cruz\nAna\tReyes & Co\nBen Cruz");
  });

  it("joins text split across runs and decodes numeric entities", () => {
    const xml = documentXml('<w:p><w:r><w:t>Ma</w:t></w:r><w:r><w:t>r&#237;a Santos</w:t></w:r></w:p>');
    expect(documentXmlText(xml)).toBe("María Santos");
  });
});

describe("docxText", () => {
  it("reads word/document.xml from a real deflated .docx archive", async () => {
    const bytes = await zip({
      "[Content_Types].xml": "<Types/>",
      "word/document.xml": documentXml(para("1. Juan Dela Cruz") + para("2. Maria Santos")),
    });
    expect(await docxText(bytes)).toBe("1. Juan Dela Cruz\n2. Maria Santos");
  });

  it("returns null when the archive has no document", async () => {
    expect(await docxText(await zip({ "other.xml": "<x/>" }))).toBeNull();
  });
});

describe("plainText", () => {
  it("reads UTF-8 with a byte order mark and UTF-16 from Notepad", () => {
    expect(plainText(new Uint8Array([0xef, 0xbb, 0xbf, ...encoder.encode("Ana")]))).toBe("Ana");
    const utf16 = new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x6e, 0x00, 0x61, 0x00]);
    expect(plainText(utf16)).toBe("Ana");
  });
});

describe("readNamesFile", () => {
  it("reads a .txt file", async () => {
    const result = await readNamesFile(file("names.txt", "Juan Dela Cruz\nMaria Santos\n"));
    expect(result).toEqual({
      ok: true,
      names: [
        { firstName: "Juan", lastName: "Dela Cruz" },
        { firstName: "Maria", lastName: "Santos" },
      ],
      skipped: 0,
    });
  });

  it("reads a .docx file", async () => {
    const bytes = await zip({ "word/document.xml": documentXml(para("Ana Reyes")) });
    expect(await readNamesFile(file("class.docx", bytes))).toMatchObject({
      ok: true,
      names: [{ firstName: "Ana", lastName: "Reyes" }],
    });
  });

  it("reads a .pdf file through the PDF reader", async () => {
    const pdf = file("list.pdf", "%PDF-1.7 fake");
    const result = await readNamesFile(pdf, async () => "Juan Dela Cruz\nAna Reyes");
    expect(result).toMatchObject({ ok: true, names: [{ lastName: "Dela Cruz" }, { lastName: "Reyes" }] });
  });

  it("explains a scanned PDF that has no text", async () => {
    const result = await readNamesFile(file("scan.pdf", "%PDF-1.7 fake"), async () => "");
    expect(result).toEqual({ ok: false, message: expect.stringContaining("scanned PDF") });
  });

  it("rejects other types, a renamed file, empty files and files over the limit", async () => {
    expect(await readNamesFile(file("names.doc", "Ana Reyes"))).toMatchObject({ ok: false });
    expect(await readNamesFile(file("names.docx", "Ana Reyes"))).toMatchObject({ ok: false });
    expect(await readNamesFile(file("names.pdf", "Ana Reyes"))).toMatchObject({ ok: false });
    expect(await readNamesFile(file("empty.txt", ""))).toEqual({ ok: false, message: "That file is empty." });
    const big = file("big.txt", new Uint8Array(NAMES_FILE_MAX_BYTES + 1));
    expect(await readNamesFile(big)).toMatchObject({ ok: false, message: expect.stringContaining("5 MB") });
  });

  it("reports a damaged .docx instead of throwing", async () => {
    const broken = file("broken.docx", new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]));
    expect(await readNamesFile(broken)).toEqual({ ok: false, message: expect.stringContaining("could not be read") });
  });
});

describe("downloadable sample lists", () => {
  // public/templates holds the samples the visit form offers. They must keep reading cleanly:
  // the title and "Prepared by" lines are skipped, and suffixes and particles stay in surnames.
  it.each(["txt", "docx"])("reads all 50 names from visitor-names-sample.%s", async (extension) => {
    const bytes = new Uint8Array(readFileSync(`public/templates/visitor-names-sample.${extension}`));
    const result = await readNamesFile(file(`visitor-names-sample.${extension}`, bytes));
    expect(result).toMatchObject({ ok: true, skipped: 2 });
    if (!result.ok) return;
    expect(result.names).toHaveLength(50);
    expect(result.names[0]).toEqual({ firstName: "Juan", lastName: "Dela Cruz" });
    expect(result.names[8]).toEqual({ firstName: "Carlo", lastName: "De los Santos" });
    expect(result.names[30]).toEqual({ firstName: "Lorenzo", lastName: "Rizal Jr." });
    expect(result.names[45]).toEqual({ firstName: "Isidro", lastName: "Macaraeg III" });
    expect(result.names[46]).toEqual({ firstName: "Rosalinda", lastName: "Sta. Maria" });
  });
});
