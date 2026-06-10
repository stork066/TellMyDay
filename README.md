# Tell My Day

An accessibility-first AAC (augmentative and alternative communication) web app. A non-speaking person taps 3–8 picture symbols (people, places, activities, feelings, food); the app turns that into 2–4 warm, first-person sentences grounded in their saved profile, shows the story with the symbols inline, and reads it aloud.

> **Synthetic data only.** Every "About Me" profile entry shipped with this repo is fictional. No real people, places, organizations, or care-setting data appears anywhere.

Built by a direct support professional.

## Status

Phase 0 — scaffold + Foundry IQ de-risk. See `tell-my-day-build-prompt.md` for the full plan.

## Stack

- React + Vite + TypeScript + Tailwind (SPA)
- Vercel serverless function at `api/generate` (holds all secrets; the browser never calls Foundry directly)
- Microsoft Foundry IQ (knowledge base on Azure AI Search) as the grounding layer
- Web Speech API for text-to-speech

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # fill in Foundry + Search values
npm run dev
```

## License

App code: MIT. Picture symbols are from the [Mulberry Symbol Set](https://mulberrysymbols.org) and are licensed under CC BY-SA 4.0 — see `LICENSES/MULBERRY.md`.
