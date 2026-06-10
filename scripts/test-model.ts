// De-risk #1: confirm a raw chat-completions call against the deployed Foundry model
// returns text. Does NOT touch the knowledge base.
//
// Run: npm run test:model

import { env, trimTrailingSlash } from "./_env.js";

async function main() {
  const openaiEndpoint = trimTrailingSlash(env.foundryOpenAIEndpoint());
  const apiKey = env.foundryApiKey();
  const deployment = env.foundryModelDeployment();

  // OpenAI-compatible v1 path. FOUNDRY_OPENAI_ENDPOINT already ends in /openai/v1.
  const url = `${openaiEndpoint}/chat/completions`;
  const body = {
    model: deployment,
    messages: [
      { role: "system", content: "You are concise." },
      { role: "user", content: "Reply with the single word: ok." },
    ],
    max_tokens: 16,
    temperature: 0,
  };

  console.log(`→ POST ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
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

  const choice = (parsed as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;

  if (!choice) {
    console.error("\n❌ No content in response. Raw:\n");
    console.error(JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  console.log(`\n✅ model="${deployment}" replied: ${JSON.stringify(choice)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
