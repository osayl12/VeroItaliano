# PLAN: Vero Italiano, "One Evening at the Oven"

Read `BRIEF.md` first. This file covers the grammar, signature move, fingerprint gate, score, hero layers, assets, build notes and verification.

---

## 1. Grammar: **"Evening Service"** (chronological chapters)

The page is **one evening at the shop**, from lighting the fire to last orders. Each act is a different moment of that night, joined by cuts (not one continuous camera flight).

| | |
|---|---|
| **Navigation** | A thin **"evening rail"** across the top. Its two ends are the shop's *real* opening and closing time for today, from the admin hours. A small flame marks your position, and the chapter names are tap targets. When the shop is closed, the rail says when it opens next. |
| **Sequence** | Strictly chronological: fire, dough, menu, oven, slice, deals, last call. You can't reorder the chapters; the clock only moves forward. |
| **Hero** | Layered depth scene (oven), not a full-frame video with centred text. |
| **Ending** | A **live status close**: real open/closed state and closing time, plus Call and WhatsApp. It resolves and holds. No fade-out, and the footer is not the ending. |
| **Bans** | No continuous chain or flythrough. No `01/07` counters. No "scroll" cue. No invented numbers. No more than one scrub video. No centred copy in two acts in a row. |

**Why not the other grammars:**
- **Filmic one-shot:** I chose distinct scenes, and a continuous flight costs the most and breaks the most for little gain.
- **Pure editorial or magazine:** too cold for food at night.
- **Gallery:** the brand is a taste and a person, not a collection.
- **Working surface / app-like:** we already have the practical menu page.
- **Maximalist collage:** fights the hush that the peak needs.

> ⚠️ The skill's `uniqueness.md`, which defines its eight grammars, did not sync. So this grammar is **defined explicitly** here, with its own nav, sequence, ending and bans, as the skill allows. I can't claim it was checked against that list.

---

## 2. Signature move: **"The Pull"**

The pie sits pinned, viewed from above. Scroll progress `p` (0→1) inside Act 5 drives it:

| `p` | What happens |
|---|---|
| 0.00–0.15 | A knife line is traced through the pie, cutting one slice (SVG path, `stroke-dashoffset`). |
| 0.15–0.75 | The slice (a PNG cutout with alpha) lifts toward the viewer. It moves up, scales from 1 to 1.12, tilts about 8°, and gets a softer, larger shadow. **Cheese strands** are drawn on a `<canvas>` between the slice edge and the pie: 7–11 Bézier strands whose sag, thickness and spacing follow the pull distance. Each strand has its own breaking point. |
| 0.75–0.85 | Strands **snap one by one** with a small spring recoil. Scroll speed matters: a fast flick snaps them early, a slow pull stretches them long. |
| 0.85–1.00 | The slice settles. The headline lands, followed by one quiet CTA ("Want this one? Order it now"), which opens WhatsApp with **that pizza** pre-filled. |

**Details:**
- **Pointer:** on desktop, the strands lean slightly toward the cursor. On touch, a small drag on the slice adds sideways sway.
- **Real data:** the pizza in this act is the owner's **featured item**. The admin gets a "featured" flag, so the peak updates when the menu does.
- **Reduced motion:** a single still frame of the slice already lifted, with cheese drawn at mid-stretch. Same copy, same button.
- **Code:** bespoke JS in the page (about 200 lines), driven off the act's progress variable. No library and no engine edits. Cheese colour is a gradient from `#ffe7a3` to `#f2c04a` to `#d9952b`, with a highlight line.

The skill also asks for one sentence a visitor would tell a friend about this site; that sentence and the emotional peak of the page are both this move.

---

## 3. Fingerprint gate

The registry (`scrollcraft/FINGERPRINTS.md`) is empty, so this is build #1 and has nothing to clear. Its row is recorded there so future builds must differ from it on at least 4 of 6 dimensions.

---

## 4. Journey and score (7 acts, about 10.5 viewport-heights total)

The length deliberately stays out of the 13.6–13.8vh band that the skill warns about.

| # | Beat | Device | Span | Copy anchor | Why this device |
|---|---|---|---|---|---|
| 1 | Recognition: dusk, the fire | **parallax** (layered hero, 4 planes) | 1.3vh | trailing side (right in RTL) | Depth and warmth before any motion asks for attention |
| 2 | Trust: the dough | **scrub** (Sharif's dough video, the only scrub) | 1.6vh | leading side, small | Real hands, slowed down under your scroll, show care without needing claims |
| 3 | Appetite: tonight's menu | **pan** (vertical scroll moves a long table sideways) | 1.8vh | split: name on the table, price on a small card | Sideways movement reads as "choices". Live menu data. |
| 4 | Hush (authored silence) | **reveal** (`clip-path` circle opening onto the fire, then closing) | 0.8vh | centre, one line | A change of state in near-darkness sets up the peak |
| 5 | **PEAK: The Pull** | **pin + bespoke canvas** | **2.6vh** (largest) | split: headline on one side, slice on the other | The signature move |
| 6 | Urgency: deals | **stack** (deal cards slide onto the table like plates, with countdowns) | 1.4vh | leading side | Light energy after the peak. Live deals data. |
| 7 | Certainty: last call | **pointer** (static frame; embers drift toward the cursor or finger) | 1.0vh plus hold | centre-weighted, with the buttons as the focus | The page stops moving and starts responding |

**Checks:**
- **7 device families**, none repeated back to back.
- **Exactly 1 scrub act** (the skill allows up to 2).
- No two acts in a row share a feeling.
- The peak has the largest span, and Act 4 before it is the quietest act.

**Draft headlines** (Hebrew first; every line also gets Arabic):
1. **האש כבר דולקת.** / النار مولّعة.
2. **בצק שנמתח ביד, כל ערב.** / عجينة بتنمد بالإيد، كل مسا.
3. **מה יוצא מהתנור הערב** / شو طالع من الفرن الليلة
4. **רגע.** / لحظة.
5. **תמשכו.** / اسحبوا. Then: *רוצים את זו? / بدكم هاي؟*
6. **רק הערב.** / بس الليلة.
7. **התנור חם עד 23:00.** / الفرن شغّال لـ 23:00. (The time is live from the database.)

---

## 5. Hero: four planes (Act 1)

| Plane | Content | Scroll movement | Pointer movement |
|---|---|---|---|
| Background | Clean plate of the stone or tiled oven wall, warm practical lights, **no text** | 0.15× | ±4px |
| Subject | The oven mouth with live fire (5–8s seamless **loop**, not scrubbed) | 0.35× | ±8px |
| *Headline* | Real `<h1>` placed **between** the subject and the foreground | 0.5×, fades from 1 to 0 over the last 30% | none |
| Foreground | A wooden peel, a flour-dusted marble edge and basil, cut out with alpha and partly overlapping the headline's lower corner | 0.8× | ±14px |
| Atmosphere | Canvas embers and flour motes (about 40 particles, capped on mobile) | own drift | slight |

**Rules:**
- Text sits on a local scrim only behind the headline, never a full-frame overlay.
- **Mobile** gets its own portrait crop: the oven fills the top 60%, the headline sits under it, the peel enters from the bottom. Planes move about half as much.
- **Reduced motion:** the planes stay layered, but nothing moves. Depth still reads from the overlap.

---

## 6. Assets

### Shot list for Sharif
Phone footage at 4K/60 if possible, landscape **and** portrait, locked on a tripod, room lights on, no music.
1. **Oven mouth with fire**, 15s, no people. This becomes the hero loop.
2. **Hands stretching dough**, top-down, 10–15s, three takes. This is the scrub video.
3. **Each pizza fresh out of the oven**, top-down on a wooden board, still photos, same angle every time. These are for the menu table.
4. **Featured pizza, whole, top-down**, plus the **same pizza with one slice lifted** (a real cheese pull, 2–3s video and stills). These are the reference and textures for The Pull.
5. **The shop exterior at dusk**, 10s. Optional; it could replace the reveal in Act 4.
6. A wide photo of the stone or tiled wall with **nothing in front of it**. This is the clean plate for the hero background.

### Processing
- Cut the slice, the pie with the gap, and the peel and basil out with real alpha, using `rembg` or Photoshop. Check the edges.
- Encode the scrub video with a dense keyframe interval (`-g 2`, no audio), plus a separate portrait version for mobile.
- Hero loop: about 1.5MB as MP4/H.264 and WebM, with a poster frame.

**Fallback:** if footage is late, generate **photoreal** stills using one fixed style preamble (warm tungsten, 35mm, shallow depth of field, real dough texture, no text in the image). Clips are optional. This needs a `KIE_AI_API_KEY` (not configured), and the skill's `kie.mjs` script didn't sync.

---

## 7. Build approach (inside the existing React app)

- Add a new route `/` with an `EveningPage`. The current page moves to `/menu` as the fast, always-works fallback, linked from the rail.
- The skill's engine (`scrollcraft.js`) did not sync, so write a small scroll driver: an `IntersectionObserver` plus one `requestAnimationFrame` loop that sets `--p` (0→1) on each act. CSS reads `--p`, using transform, opacity and clip-path only.
- **Data:**
  - Hours, deals and menu come from `/api/public/site`.
  - **New:** `featured` (bool) on `MenuItem` for Act 5, with an admin toggle.
- **RTL:** in Act 3 the sideways table moves right to left, the reading direction.
- **Budget:**
  - At most one video playing at a time. Pause videos that are off screen.
  - On mobile: one scrub video, canvas capped at 30fps, and no more than 20 particles.
  - First screen under 1.5MB, and LCP is the hero background plate.
- **Taste rules (from the skill):**
  - No em dashes in visible copy.
  - At most one small label above a heading, in only one of every three sections.
  - Emphasis comes from weight and size, not glows or gradient text.
  - No counters with invented numbers.

---

## 8. Verification

1. Take Playwright screenshots of each act at 6 scroll positions, on desktop (1440×900) and mobile (390×844), and with reduced motion. Make a contact sheet.
2. Check automatically:
   - **dead scroll** (excluding the authored silence in Act 4)
   - text that never reaches full opacity
   - text contrast measured on the composited frame at its **brightest** moment
3. **Feel check:** scroll the page cold and write one word per act, then compare with the curve in BRIEF.md. The page changes, not the brief.
4. Tab through the page: focus order and the rail links.
5. **Real phone test** on an iPhone (Safari, Low Power Mode on) and an Android: the hero loop autoplays muted, the scrub doesn't freeze, the cheese canvas runs smoothly.

---

## 9. Open questions for Sharif

These are the only things needed before building:
1. Real dough proof time and bake time, or we leave numbers out.
2. Which pizza is the **featured** one for The Pull?
3. Can he film the shot list this week?
4. Is it a wood-fired oven, a stone gas oven, or something else? This changes the hero copy.
