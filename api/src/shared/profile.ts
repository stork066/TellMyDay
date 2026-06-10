// Caregiver profile editor backend. Every operation requires the caregiver
// PIN (CARETAKER_PIN env var), verified server-side only. The Foundry IQ
// knowledge source is the single source of truth: reads come from the
// retrieve API (the file API has no content readback), writes replace the
// section's file via delete + upload.

import { timingSafeEqual } from "node:crypto";
import { HttpError, searchEnv } from "./story.js";

// Must match the knowledge source created by scripts/setup-iq.ts.
const KS_NAME = "tell-my-day-ks";
// The index Azure AI Search creates behind the file knowledge source; read
// directly for full file content (the KS file API has no content readback).
const KS_INDEX = `${KS_NAME}-index`;
const SEARCH_QUERY_API_VERSION = "2024-07-01";

export const PROFILE_SECTIONS = ["people", "places", "activities", "food", "comfort"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

const MAX_SECTION_CHARS = 20_000;

export function checkPin(provided: unknown): void {
  const pin = process.env.CARETAKER_PIN?.trim();
  if (!pin) {
    throw new HttpError(500, "The caregiver PIN is not set up on the server.");
  }
  if (typeof provided !== "string" || provided.length === 0) {
    throw new HttpError(401, "Enter the caregiver PIN.");
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(pin);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(401, "That PIN isn't right.");
  }
}

export function validateSectionInput(body: unknown): { section: ProfileSection; content: string } {
  const { section, content } = (body ?? {}) as { section?: unknown; content?: unknown };
  if (typeof section !== "string" || !PROFILE_SECTIONS.includes(section as ProfileSection)) {
    throw new HttpError(400, "Unknown profile section.");
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new HttpError(400, "The section text can't be empty.");
  }
  if (content.length > MAX_SECTION_CHARS) {
    throw new HttpError(400, "That section is too long. Keep it under 20,000 characters.");
  }
  return { section: section as ProfileSection, content };
}

async function listFiles(): Promise<{ fileId: string; fileName: string }[]> {
  const { endpoint, key, apiVersion } = searchEnv();
  const res = await fetch(`${endpoint}/knowledgesources/${KS_NAME}/files?api-version=${apiVersion}`, {
    headers: { "api-key": key },
  });
  if (!res.ok) {
    console.error(`KS list failed: HTTP ${res.status} ${await res.text()}`);
    throw new HttpError(502, "We couldn't reach the profile storage. Please try again.");
  }
  const listing = (await res.json()) as { value?: { fileId: string; fileName: string }[] };
  return listing.value ?? [];
}

export async function getProfile(): Promise<Record<ProfileSection, string>> {
  const { endpoint, key } = searchEnv();
  const files = await listFiles();

  const res = await fetch(
    `${endpoint}/indexes/${KS_INDEX}/docs/search?api-version=${SEARCH_QUERY_API_VERSION}`,
    {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ search: "*", top: 200, select: "uid,snippet,snippet_parent_id" }),
    },
  );
  if (!res.ok) {
    console.error(`KS index query failed: HTTP ${res.status} ${await res.text()}`);
    throw new HttpError(502, "We couldn't read the profile right now. Please try again.");
  }
  const data = (await res.json()) as {
    value?: { uid: string; snippet: string; snippet_parent_id: string }[];
  };

  // A file can be split into several chunks; reassemble in uid order.
  const chunksByFile = new Map<string, { uid: string; snippet: string }[]>();
  for (const doc of data.value ?? []) {
    const list = chunksByFile.get(doc.snippet_parent_id) ?? [];
    list.push({ uid: doc.uid, snippet: doc.snippet });
    chunksByFile.set(doc.snippet_parent_id, list);
  }

  const result = Object.fromEntries(PROFILE_SECTIONS.map((s) => [s, ""])) as Record<
    ProfileSection,
    string
  >;
  for (const file of files) {
    const section = file.fileName.replace(/\.md$/, "") as ProfileSection;
    if (!PROFILE_SECTIONS.includes(section)) continue;
    const chunks = chunksByFile.get(file.fileId);
    if (!chunks) continue;
    result[section] = chunks
      .sort((a, b) => a.uid.localeCompare(b.uid, undefined, { numeric: true }))
      .map((c) => c.snippet)
      .join("\n");
  }
  return result;
}

export async function saveSection(section: ProfileSection, content: string): Promise<void> {
  const { endpoint, key, apiVersion } = searchEnv();
  const base = `${endpoint}/knowledgesources/${KS_NAME}/files`;
  const fileName = `${section}.md`;

  const existing = (await listFiles()).find((f) => f.fileName === fileName);

  if (existing) {
    const delRes = await fetch(`${base}/${existing.fileId}?api-version=${apiVersion}`, {
      method: "DELETE",
      headers: { "api-key": key },
    });
    if (!delRes.ok && delRes.status !== 404) {
      console.error(`KS delete failed: HTTP ${delRes.status} ${await delRes.text()}`);
      throw new HttpError(502, "We couldn't replace the old section. Please try again.");
    }
  }

  const upRes = await fetch(`${base}?api-version=${apiVersion}`, {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
    body: content,
  });
  if (!upRes.ok) {
    console.error(`KS upload failed: HTTP ${upRes.status} ${await upRes.text()}`);
    throw new HttpError(502, "We couldn't save the new section. Please try again.");
  }
  const meta = (await upRes.json()) as { errorMessage?: string | null };
  if (meta.errorMessage) {
    console.error(`KS upload processed with error: ${meta.errorMessage}`);
    throw new HttpError(502, "The profile storage rejected the new section. Please try again.");
  }
}
