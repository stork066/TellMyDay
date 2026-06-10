# Tell My Day — master build prompt

**How to use:** paste everything below the line into Claude Code (or the GitHub Copilot CLI) at the root of an empty folder. It's self-contained, but if `/docs/C1-tell-my-day-aac.md`, `/docs/AgentsLeague-master-context.md`, or a plan file are present, the agent will read them for depth. The agent will propose a plan first — review it before letting it build.

> **Compliance note (not part of the prompt):** the Creative Apps track requires building with GitHub Copilot. Run this prompt through the **GitHub Copilot CLI** to be unambiguously compliant, or use Claude Code while also running Copilot in VS Code and naming GitHub Copilot on your architecture diagram. Also paste the "Hard constraints" + "Foundry IQ" sections into a `CLAUDE.md` (or `.github/copilot-instructions.md`) so they persist across sessions.

---

You are building **Tell My Day**, an accessibility-first AAC (augmentative and alternative communication) web app. Build it with me in small, reviewable steps — do not dump the whole app at once.

## What it is
A non-speaking person taps 3–8 picture symbols (people, places, activities, feelings, food) to compose a "moment." The app turns that into 2–4 warm, first-person sentences — grounded in their own saved profile so "my friend" becomes "my friend Marcus" — shows the story with the symbols inline, and reads it aloud. The point is letting someone *tell their day*, not just point at fragments. It's built by a direct-support professional, so it must feel dignified and real, never clinical or infantilizing.

## Stack (use exactly this)
- React + Vite + TypeScript + Tailwind (SPA).
- One serverless function at `api/generate` (Vercel) that holds all secrets and talks to Microsoft Foundry. The browser never calls Foundry directly.
- Text-to-speech via the browser Web Speech API.
- Deploy target: Vercel.

## Architecture
```
React/Vite SPA (browser)
  → POST /api/generate  { symbols, readingLevel }   (serverless fn; holds secrets)
      → Foundry agent (model: gpt-4.1-mini or a Foundry-hosted Claude)
          with a Foundry IQ knowledge base attached as an MCP tool (knowledge_base_retrieve)
          → agentic retrieval over a synthetic "About Me" profile
          → grounded first-person narration + source citations
  ← { narration, citations }
TTS: Web Speech API (browser)
```

## Microsoft IQ is REQUIRED — use Foundry IQ (this is mandatory, not optional)
Every contest submission must integrate a Microsoft IQ layer. We use **Foundry IQ** (a knowledge/retrieval layer built on Azure AI Search). It is also the feature that makes the narration personal and gives us citations — so treat it as core, not a bolt-on.

The knowledge base holds a **synthetic, fictional "About Me" / communication-passport profile** for one made-up AAC user. Generate it as a few small documents covering: people (names + relationship, e.g. "Marcus — best friend"), regular places ("the YMCA pool — goes Thursdays"), routine activities, food preferences ("favorite ice cream — mint chocolate chip"), pets, and things that comfort/upset them. Everything is invented; state clearly in the repo that it's synthetic.

Wiring (verify the current method against live docs — Foundry IQ is in preview and moving; current API version is `2026-05-01-preview`):
- Concept + connect docs: `learn.microsoft.com/azure/foundry/agents/concepts/what-is-foundry-iq` and `learn.microsoft.com/azure/foundry/agents/how-to/foundry-iq-connect`
- Recommended POC path: create the **knowledge base + knowledge source in the Foundry portal**, attach it to an **agent** as an MCP tool (`server_url` like `{search_service_endpoint}/knowledgebases/{kb_name}/mcp?api-version=2026-05-01-preview`, `allowed_tools: ["knowledge_base_retrieve"]`), test in the **playground**, then have `api/generate` call that agent.
- Fallback if the agent+MCP setup is too heavy: call the knowledge base `retrieve` API directly from `api/generate`, then pass the retrieved facts into a normal chat-completions call. Either satisfies the requirement.
- Keep the model deployment name, Foundry endpoint, search endpoint, and KB name all in **env vars** so they're swappable.

The agent/system instructions (adapt to the AAC use case — this also enforces our safety rule):
> You help a non-speaking person narrate a moment from their day. You receive an ordered list of picture symbols they selected, and you may retrieve facts about them from the knowledge base (their people, places, routines, preferences). Write 2–4 short, warm, first-person sentences using ONLY (a) the ideas in the selected symbols and (b) facts you retrieve that match those symbols. Never invent people, places, events, or details not present in the symbols or the retrieved facts. If a symbol has no matching fact, keep that part general ("my friend", not a made-up name). Provide source annotations for any retrieved fact you use. Match a {readingLevel} reading level. Tone: positive, dignified, age-appropriate for an adult. Output only the sentences.

## Hard constraints (do not violate)
- **No-invention / grounding rule** (the core safety property — keep it strict): generated narration uses ONLY the selected symbols plus facts retrieved from the knowledge base. Never fabricate names, places, events, or details. If something isn't in the symbols or the profile, stay general. This is 40% of the contest score (Reasoning + Reliability) — protect it and make it visible in the UI.
- **Child-safe, dignified, adult-appropriate tone.** Never patronizing.
- **Synthetic data ONLY.** The profile and all demo content are fictional. No real names, organizations, employer, or care-setting data anywhere in code, comments, commits, or the demo. State "synthetic/fictional" in the repo and video. (The contest disclaimer forbids uploading confidential info.)
- **Secrets in env vars only.** Never hardcode or commit keys/endpoints. `.env.local` is gitignored. Confirm this before the first commit and grep history before going public.
- **Fixed scope: one screen, one flow.** No accounts, no multi-user, no database, no chat history. Ask before adding any feature beyond this spec.

## Accessibility is the product, not an add-on (build it into every component)
- Min 64px tap targets; every control has icon + visible label + `aria-label`; visible focus rings; `aria-pressed` on selectable symbols.
- Full keyboard navigation AND **single-switch scanning**: an optional mode where an auto-advancing highlight cycles through interactive elements on a configurable timer (default ~1.2s) and a single input (Spacebar or full-screen tap) selects the highlighted element. Use **two-level scanning**: scan groups first (category tabs → symbol grid → action buttons), enter a group on select, scan its items, with an escape/back highlight to return. Everything reachable by switch alone.
- High-contrast theme via CSS custom properties (light + high-contrast variants); adjustable text size wired to a single base-font CSS variable; `prefers-reduced-motion` mode (highlight by outline, not animation).
- Story output uses `aria-live="polite"` so new narration is announced. Logical focus order throughout.

## How to work
1. **Plan first.** Read any `/docs` and plan files present, then propose the files you'll create and your approach. Do NOT write code until I approve.
2. **Verify Foundry + Foundry IQ against live docs** before wiring them — the SDK/API surface is in preview.
3. **De-risk before building around it.** Get (a) a raw model call and (b) a knowledge-base retrieve returning results via a quick test/curl, and show me the output, before building app features on top.
4. **Small, verifiable steps.** One component or function per step. After each, run `npm run dev`, report what you verified, and commit per phase (`git commit -m "P1: symbol board"`).
5. **Test the risky bit.** Write a test asserting the narration never contains a name or place that isn't in the selected symbols or the retrieved facts, plus input validation on `api/generate` (1–8 symbols, known reading level).
6. **Secrets discipline.** `.env.local` gitignored; Vercel env vars in prod.

## Build phases
- **Phase 0 — Setup & de-risk:** Vite + React + TS + Tailwind scaffold with an accessible shell (skip-link, h1, high-contrast CSS-variable theme, controllable base font). Generate the synthetic "About Me" profile docs. Stand up the Foundry IQ knowledge base + agent in the portal and confirm a retrieve works. Confirm a model call works. Source ~30 Mulberry Symbols (CC BY-SA 4.0 — commercial-use-friendly) into `/public/symbols/` and generate a typed `src/data/symbols.ts` manifest (id, label, category, file; 5 categories). **Do not proceed until the IQ retrieve and model call both return output.**
- **Phase 1 — Symbol board:** category-tabbed grid of large accessible `SymbolButton`s; selection state lifted to App (ordered `moment` array, cap 8); a `MomentBar` showing the selected sequence with remove and keyboard-operable reordering. Keyboard-only operable from the start.
- **Phase 2 — Generation:** the `api/generate` serverless function (calls the IQ-grounded agent, validates/clamps input, fails gracefully with a friendly message instead of a stack trace); a client `generateStory` with loading + error states; a `StoryView` rendering the narration with inline symbols and a reading-level selector. **Make the guardrail visible:** show which details were grounded from the profile (citations), and demonstrate that a symbol with no profile match stays general rather than invented.
- **Phase 3 — Voice + AAC accessibility:** Web Speech TTS with Play/Pause and rate/pitch controls; optional read-along that highlights each word/symbol via the `boundary` event; the two-level switch-scanning mode; reduced-motion mode; text-size control; final ARIA/contrast audit (target a clean Lighthouse/axe pass).
- **Phase 4 — Polish / deploy / submit:** a read-only "family view" share card (client-side only, no storage); a README with a "built by a direct-support professional" line, problem/features/tech, accessibility choices (lead with switch scanning + IQ grounding), Mulberry attribution, a clear synthetic-data note, and the Microsoft Learn username; an architecture diagram (Excalidraw/draw.io) in the repo naming **GitHub Copilot** (dev tool), **Foundry IQ** (knowledge), the **Foundry model**, and **Web Speech API**; deploy to Vercel with secrets as env vars.

## Optional stretch (only if time; cuttable)
Story **frames** — a selector that changes the framing/tense: recount ("Today I…") / wish-plan ("I want to visit…", "Tomorrow I'll…") / about-someone ("My friend was sad, I helped"). One UI control + a branch in the agent instructions. The grounding rule must hold in every frame — framing can flex, facts never can.

## Definition of done
- [ ] Working app deployed on Vercel (live URL) + public GitHub repo with README.
- [ ] Foundry IQ integration is real and visible (grounded, cited narration).
- [ ] No-invention guardrail demonstrably holds (general output when no profile match; never fabricated).
- [ ] Full keyboard + single-switch operation; TTS works; reduced-motion honored.
- [ ] Architecture diagram in repo naming GitHub Copilot + Foundry IQ + the model.
- [ ] All content synthetic; no real names/orgs anywhere; stated in repo + video.
- [ ] No secrets in git history.
- [ ] (You) ≤5-min demo video, filmed + edited by you, showing the grounding guardrail; Microsoft Learn username added; registered for the contest.

Start by reading any docs/plan files present and proposing your plan and file list. Wait for my approval before writing code.
