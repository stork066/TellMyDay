// Loads .env.local for the standalone scripts and validates the variables they need.

import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

export function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    console.error(
      `\nMissing required env var: ${name}\nCopy .env.local.example to .env.local and fill it in.\n`,
    );
    process.exit(1);
  }
  return v.trim();
}

export const env = {
  foundryProjectEndpoint: () => required("FOUNDRY_PROJECT_ENDPOINT"),
  foundryOpenAIEndpoint: () => required("FOUNDRY_OPENAI_ENDPOINT"),
  foundryApiKey: () => required("FOUNDRY_API_KEY"),
  foundryModelDeployment: () => required("FOUNDRY_MODEL_DEPLOYMENT"),
  foundryAgentName: () => required("FOUNDRY_AGENT_NAME"),
  searchEndpoint: () => required("AZURE_SEARCH_ENDPOINT"),
  searchKey: () => required("AZURE_SEARCH_KEY"),
  searchKbName: () => required("AZURE_SEARCH_KB_NAME"),
  iqApiVersion: () => process.env.FOUNDRY_IQ_API_VERSION?.trim() || "2026-05-01-preview",
};

export function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}
