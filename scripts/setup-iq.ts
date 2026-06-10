// One-shot setup for the Foundry IQ knowledge base on Azure AI Search.
//
// 1. Create a "file" knowledge source (keyword retrieval — no embedding model)
// 2. Upload every docs/profile/*.md as a file
// 3. Create the knowledge base referencing that source
// 4. List files + KB to confirm
//
// Idempotent: safe to re-run. Uses PUT so existing objects are replaced.
//
// Run: npm run setup:iq

import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env, trimTrailingSlash } from "./_env.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROFILE_DIR = resolve(__dirname, "../docs/profile");

const KS_NAME = "tell-my-day-ks";

async function main() {
  const searchEndpoint = trimTrailingSlash(env.searchEndpoint());
  const searchKey = env.searchKey();
  const kbName = env.searchKbName();
  const apiVersion = env.iqApiVersion();

  const baseHeaders = {
    "api-key": searchKey,
    "Content-Type": "application/json",
  };

  // 1) Create / update the knowledge source.
  console.log(`→ PUT knowledgesources/${KS_NAME}`);
  {
    const url = `${searchEndpoint}/knowledgesources/${KS_NAME}?api-version=${apiVersion}`;
    const body = {
      name: KS_NAME,
      kind: "file",
      description:
        "Synthetic About-Me profile for the Tell My Day AAC demo. Five short markdown files: people, places, activities, food, comfort.",
      fileParameters: {
        ingestionParameters: {
          contentExtractionMode: "minimal",
        },
      },
    };
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...baseHeaders, Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}\n${await res.text()}`);
      process.exit(1);
    }
    console.log("   ✓ knowledge source ready");
  }

  // 2) Upload every profile markdown.
  console.log(`→ uploading profile files from ${PROFILE_DIR}`);
  const entries = (await readdir(PROFILE_DIR)).filter(
    (n) => n.endsWith(".md") && n !== "README.md",
  );
  if (entries.length === 0) {
    console.error("❌ No .md files found in docs/profile/");
    process.exit(1);
  }

  // List existing files so we can skip ones already uploaded with the same name.
  const listUrl = `${searchEndpoint}/knowledgesources/${KS_NAME}/files?api-version=${apiVersion}`;
  const listRes = await fetch(listUrl, { headers: baseHeaders });
  if (!listRes.ok) {
    console.error(`❌ list-files HTTP ${listRes.status}\n${await listRes.text()}`);
    process.exit(1);
  }
  const existing = (await listRes.json()) as {
    value?: { fileId: string; fileName: string; errorMessage?: string | null }[];
  };
  const existingNames = new Set(existing.value?.map((f) => f.fileName) ?? []);

  for (const fname of entries) {
    if (existingNames.has(fname)) {
      console.log(`   • ${fname} — already uploaded, skipping`);
      continue;
    }
    const bytes = await readFile(resolve(PROFILE_DIR, fname));
    const upUrl = `${searchEndpoint}/knowledgesources/${KS_NAME}/files?api-version=${apiVersion}`;
    const upRes = await fetch(upUrl, {
      method: "POST",
      headers: {
        "api-key": searchKey,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
      body: bytes,
    });
    if (!upRes.ok) {
      console.error(`❌ upload ${fname} HTTP ${upRes.status}\n${await upRes.text()}`);
      process.exit(1);
    }
    const meta = (await upRes.json()) as { fileId?: string; errorMessage?: string | null };
    if (meta.errorMessage) {
      console.error(`❌ upload ${fname} processed with error: ${meta.errorMessage}`);
      process.exit(1);
    }
    console.log(`   ✓ ${fname} (id=${meta.fileId})`);
  }

  // 3) Create / update the knowledge base referencing the source.
  console.log(`→ PUT knowledgebases/${kbName}`);
  {
    const url = `${searchEndpoint}/knowledgebases/${kbName}?api-version=${apiVersion}`;
    const body = {
      name: kbName,
      description: "Tell My Day — grounded retrieval over Sam's synthetic profile.",
      knowledgeSources: [{ name: KS_NAME }],
      retrievalReasoningEffort: { kind: "minimal" },
    };
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...baseHeaders, Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}\n${await res.text()}`);
      process.exit(1);
    }
    console.log(`   ✓ knowledge base ready (kb=${kbName})`);
  }

  console.log("\n✅ Foundry IQ setup complete. Next: npm run test:iq\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
