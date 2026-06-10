// De-risk #2: confirm a `retrieve` call against the Foundry IQ knowledge base
// returns grounded content from the synthetic profile.
//
// Run: npm run test:iq

import { env, trimTrailingSlash } from "./_env.js";

async function main() {
  const searchEndpoint = trimTrailingSlash(env.searchEndpoint());
  const searchKey = env.searchKey();
  const kbName = env.searchKbName();
  const apiVersion = env.iqApiVersion();

  const url = `${searchEndpoint}/knowledgebases/${encodeURIComponent(kbName)}/retrieve?api-version=${apiVersion}`;
  // KB is set to retrievalReasoningEffort=minimal, which expects `intents`
  // (pre-planned query strings) instead of `messages` (LLM-planned).
  const body = {
    intents: [
      { type: "semantic", search: "What does Sam do on Thursdays?" },
      { type: "semantic", search: "Who is Sam's best friend?" },
      { type: "semantic", search: "What is Sam's dog's name?" },
    ],
    includeActivity: true,
  };

  console.log(`→ POST ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": searchKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok && res.status !== 206) {
    console.error(`\n❌ HTTP ${res.status} ${res.statusText}\n`);
    console.error(text);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("\n❌ Non-JSON response:\n");
    console.error(text);
    process.exit(1);
  }

  // Extract the response text and citation count. Shape varies by api-version
  // and output mode; print enough to confirm grounding is real.
  const obj = parsed as {
    response?: { content?: { text?: string }[] }[];
    references?: unknown[];
    activity?: unknown[];
  };

  const responseText = obj.response?.[0]?.content?.[0]?.text;
  const refCount = obj.references?.length ?? 0;

  if (!responseText) {
    console.error("\n❌ No response text. Raw payload:\n");
    console.error(JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  console.log(`\n✅ Retrieved ${refCount} reference(s) from kb="${kbName}".\n`);
  console.log("Response text:");
  console.log("---");
  console.log(responseText);
  console.log("---\n");

  if (refCount === 0) {
    console.warn(
      "⚠ No references returned. Confirm the synthetic profile docs were added to the knowledge source and indexed.",
    );
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
