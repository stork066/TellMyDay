# Tell My Day — agent guardrails

These rules persist across sessions. Read before editing.

## Hard constraints (do not violate)

- **No-invention / grounding rule.** Narration uses ONLY (a) the ideas in the selected symbols and (b) facts retrieved from the Foundry IQ knowledge base. Never fabricate names, places, events, or details. If a symbol has no matching profile fact, stay general ("my friend", not a made-up name). This is the core safety property of the app and 40 % of the contest score (Reasoning + Reliability). Make it visible in the UI (citations) and protect it with tests.
- **Child-safe, dignified, adult-appropriate tone.** Never patronizing or clinical. The user is an adult.
- **Synthetic data ONLY.** The "About Me" profile and every demo input are fictional. No real names, organizations, employers, schools, addresses, or care-setting details anywhere in code, comments, commits, or videos. State "synthetic/fictional" wherever the profile appears.
- **Secrets in env vars only.** `.env.local` is gitignored. Never hardcode keys or endpoints. Before any push, grep history for `sk-`, `Bearer`, and the literal `search.windows.net` host followed by a real key.
- **Fixed scope.** One screen, one flow. No accounts, no multi-user, no database, no chat history. Ask before adding anything beyond the spec in `tell-my-day-build-prompt.md`.

## Microsoft Foundry IQ wiring

- Knowledge base + knowledge source live in Azure AI Search, attached to a Foundry agent via an MCP tool. MCP server URL is `{search_service_endpoint}/knowledgebases/{kb_name}/mcp?api-version=2026-05-01-preview`, `allowed_tools: ["knowledge_base_retrieve"]`.
- Fallback if the agent + MCP setup is too heavy: call the KB `retrieve` API directly and pass the hits into a normal chat-completions call. Either path satisfies the requirement.
- Env-var only: `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_API_KEY`, `FOUNDRY_MODEL_DEPLOYMENT`, `FOUNDRY_AGENT_NAME`, `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_KEY`, `AZURE_SEARCH_KB_NAME`, `FOUNDRY_IQ_API_VERSION`.

## Accessibility is the product

- Minimum 64 px tap targets (Tailwind: `min-h-tap min-w-tap`).
- Every control has icon + visible label + `aria-label`.
- Selectable symbols use `aria-pressed`.
- Two-level single-switch scanning (groups → items), default ~1.2 s, Space or full-screen tap to select.
- Story output uses `aria-live="polite"`.
- High-contrast theme + adjustable text size are first-class, not afterthoughts.
- Honor `prefers-reduced-motion` (highlight by outline, no animation).

## Agent / system instructions (reference)

> You help a non-speaking person narrate a moment from their day. You receive an ordered list of picture symbols they selected, and you may retrieve facts about them from the knowledge base (their people, places, routines, preferences). Write 2–4 short, warm, first-person sentences using ONLY (a) the ideas in the selected symbols and (b) facts you retrieve that match those symbols. Never invent people, places, events, or details not present in the symbols or the retrieved facts. If a symbol has no matching fact, keep that part general ("my friend", not a made-up name). Provide source annotations for any retrieved fact you use. Match a {readingLevel} reading level. Tone: positive, dignified, age-appropriate for an adult. Output only the sentences.
