# Tell My Day — demo video script (~3 minutes)

## Before you hit record

- [ ] Open the **deployed site** in Chrome or Edge (best read-aloud voices), full screen, default theme
- [ ] Do one throwaway story first so the API is warm (no cold-start pause on camera)
- [ ] Turn switch scanning OFF, clear the moment bar
- [ ] Have the caregiver PIN ready
- [ ] Plan to speak at a relaxed pace — the lines below run ~2:50 if read naturally

---

## 0:00 – 0:25 — The problem

**On screen:** the app's home screen, symbol board visible.

> "I'm a direct support professional. Many of the people I support are non-speaking adults who use symbol boards to communicate in the moment — but sharing how their *day went*, as a story in their own voice, is much harder. Usually a caregiver ends up narrating for them. I built Tell My Day to flip that — and I used AI to do it safely."

## 0:25 – 0:50 — The AI problem to solve

**On screen:** stay on the home screen, hover over the symbol board.

> "The obvious approach — just ask a language model to write a story — fails here, because models invent things. For someone who can't easily correct the output, a made-up name or event isn't a quirk, it's putting words in their mouth. So the real problem I used AI to solve was: generate a personal story that is *provably* grounded in facts about the person, and nothing else."

## 0:50 – 1:35 — The golden path

**On screen:** tap **Mom → Cafe → Happy** (watch them land in the moment bar), then press **Tell my day**.

> "The person picks three to eight symbols for their moment. When they press Tell my day, the symbols go to an Azure Function, which retrieves matching facts from a Microsoft Foundry IQ knowledge base — their 'About Me' profile — and gpt-4.1-mini writes two to four first-person sentences using *only* the symbols and those retrieved facts."

**On screen:** when the story appears, scroll to the **citations panel** and point at a "found in profile ✓" entry.

> "And here's the key part: every fact the model uses must come back as a verbatim quote, and the server re-verifies each quote against the retrieved text before showing it. These citations aren't decoration — each check mark means that sentence is anchored to a real line in the profile."

**On screen:** press **Read aloud**, let one sentence play with the word highlighting, then stop.

> "The story reads aloud with word-by-word highlighting, so it's their voice in the room."

## 1:35 – 2:05 — The no-invention guardrail

**On screen:** clear the moment, pick **Grandma → Beach → Happy**, press **Tell my day**.

> "Now watch what happens when I pick symbols that have *no* matching facts in the profile. There's no grandma and no beach in Joey's profile — Joey is fictional, by the way, all the data in this demo is synthetic. Instead of inventing a name or a memory, the story stays general, and the app says so. The model is told it may not invent, and the citation verifier means it can't get away with it quietly. That's the reliability property this whole app is built around."

## 2:05 – 2:30 — Accessibility is the product

**On screen:** turn on **Switch scanning**, and drive it: let groups highlight, press **Space** to drill into the symbol board, Space again to select a symbol.

> "Accessibility isn't a feature list here, it's the product. The entire app can be driven with a single switch — one key or one tap. Groups highlight in turn, the switch drills in, the switch selects. Plus high contrast, large text, reduced motion, and 64-pixel tap targets everywhere."

**On screen:** turn scanning back off.

## 2:30 – 2:55 — The caregiver editor (closing the loop)

**On screen:** footer → **Caregiver settings** → enter PIN → show the profile sections, type a short new fictional fact into one (e.g., food), press Save.

> "The profile itself is maintained by a caregiver behind a PIN — and deliberately, this button is unreachable through switch scanning, so the primary user can't change their own facts by accident. Edits write straight back to the Foundry IQ knowledge base, so within about a minute, new facts start appearing in stories — with citations."

## 2:55 – 3:10 — Close

**On screen:** back to the story view with citations visible.

> "Tell My Day was built end-to-end with GitHub Copilot, and runs on Azure Static Web Apps, Azure Functions, Foundry IQ, and a Foundry gpt-4.1-mini deployment. AI didn't just write this app — AI with a verifiable grounding contract is what makes it safe enough to speak for someone. Thanks for watching."

---

## If something goes wrong on camera

- **Story takes long:** keep talking through the retrieval explanation; it lands naturally.
- **Grandma/Beach story accidentally cites something:** that's fine — narrate what the citation panel actually shows; the point is it only says what it can prove.
- **Caregiver edit not in stories yet:** don't wait on camera — say "within about a minute" and move on (the save confirmation message makes the point).
