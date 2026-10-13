# Elements Database

A text database of all 118 chemical elements, written for a children's educational
site (roughly ages 8–13). Descriptions and facts are in plain, concrete language;
the underlying data (atomic numbers, oxidation states, abundances) is sourced from
standard reference tables.

## Files

| File | What it is |
|------|------------|
| `elements.json` | The database. Primary deliverable — feed this to the site. |
| `ELEMENTS.md` | Human-readable version of the same data, for reading/proofing. |
| `data/part-*.json` | Source shards (20 elements each) that merge into `elements.json`. |

Regenerate `elements.json` and `ELEMENTS.md` from the shards by re-running the
merge script (see *Rebuilding* below).

## Contents

- **118** elements, complete, hydrogen through oganesson
- **963** compound entries
- **590** fun facts (5 per element)

## Schema

```jsonc
{
  "title": "…",
  "description": "…",
  "elementCount": 118,
  "elements": [
    {
      "atomicNumber": 1,              // int, 1–118, array is sorted by this
      "symbol": "H",                  // unique
      "name": "Hydrogen",
      "nameZh": "氢",                  // Simplified Chinese, always 1 character
      "pinyin": "qīng",               // with tone marks
      "nameZhRareGlyph": true,        // OPTIONAL — only on the 14 that need font fallback
      "category": "Reactive nonmetal",// e.g. Alkali metal, Noble gas, Lanthanide…
      "group": 1,                     // int, or null for lanthanides/actinides
      "period": 1,
      "block": "s",                   // s | p | d | f
      "atomicMass": 1.008,            // for synthetics: mass of most stable isotope
      "stateAtRoomTemp": "gas",       // solid | liquid | gas (+ "(predicted)")
      "discovered": {
        "year": 1766,                 // null if known since antiquity
        "by": "Henry Cavendish"
      },
      "nameMeaning": "From Greek hydro + genes, 'water maker'",
      "zhRadical": {                  // what the character's radical signals
        "radical": "气",
        "means": "gas",
        "note": "The 气 (gas) radical — this element is a gas."
      },
      "crustAbundancePpm": 1400,      // mg/kg in Earth's crust; 0 for synthetics
      "charges": {
        "common": [1],                // the oxidation states usually taught
        "all": [-1, 1]                // every documented state
      },
      "description": "…",             // 2–4 sentences, kid-facing
      "funFacts": ["…"],              // exactly 5 per element
      "compounds": [                  // 10 for most elements — see below
        // nameZh present on the FIRST 5 only (light Chinese, not full translation)
        { "formula": "H2O", "name": "Water", "nameZh": "水", "about": "…" }
      ],
      "compoundsNote": "…",           // OPTIONAL — see below
      "compoundsExamples": [ … ]      // OPTIONAL — see below
    }
  ]
}
```

### Compounds: read this before rendering

95 of 118 elements have a full list of 10 compounds. **23 do not, because they
genuinely cannot** — you cannot list ten common compounds of an element that
forms none. These fall into three groups:

1. **Noble gases** (He, Ne, Ar, Kr, Rn) — form few or no compounds.
   Ne has literally zero; He, Ar have only fragile lab-made molecules.
2. **Heavy actinides** (Md, No, Lr) — never produced in weighable amounts;
   chemistry known only from solution tracer studies.
3. **Superheavy synthetics** (Rf–Og) — most decay in under a second. A handful
   (Rf, Db, Sg, Bh, Hs) have 1–3 compounds observed one atom at a time; the rest
   (Mt, Ds, Rg, Cn, Nh, Fl, Mc, Lv, Ts, Og) have none at all.

Every one of those 23 carries a **`compoundsNote`** — a kid-friendly sentence
explaining *why* the list is short. Some also carry **`compoundsExamples`**:
compounds that exist but are too exotic to call "common" (e.g. `HeH+`, `HArF`,
`Cn–Au`). This is deliberate — telling a child "oganesson has no known compounds
and here's why" is better science than inventing ten.

**Rendering guidance:** if `compounds` is empty or short, show `compoundsNote`
in place of (or above) the table, then list `compoundsExamples` if present.

```js
const c = element.compounds ?? [];
if (c.length < 10 && element.compoundsNote) renderNote(element.compoundsNote);
if (c.length) renderTable(c);
renderExamples(element.compoundsExamples ?? []);
```

### Chinese: light touch by design

The Chinese content is deliberately a **garnish, not a translation**. Descriptions,
facts, and the "about" blurbs stay in English. What's in Chinese:

- **Every element name** — `nameZh` + `pinyin` (118/118)
- **The top 5 compounds only** — `nameZh` on `compounds[0..4]` (488 entries).
  Compounds 6–10 have no Chinese. This is intentional: it keeps the flourish
  light and halves the surface area to proofread.
- **A radical explainer** at the top level (`chineseNote`).

**The radical hook is the most teachable part.** Chinese element names encode
their own chemistry — the radical tells you the category:

| Radical | Means | Count | Examples |
|---------|-------|-------|----------|
| 气 | gas | 12 | 氢 hydrogen, 氧 oxygen, 氦 helium |
| 钅 | metal | 92 | 铁 iron, 铜 copper, 锌 zinc |
| 石 | solid nonmetal | 11 | 碳 carbon, 硫 sulfur, 硅 silicon |
| 氵/水 | liquid | 2 | 溴 bromine, 汞 mercury |
| 金 | gold | 1 | 金 — the character every metal name is built from |

Note the payoff for kids: **exactly two elements carry the water radical, and
they are exactly the two liquid elements.** That's a genuinely satisfying
"the writing system knows chemistry" moment, and it's worth building a UI
around — e.g. color-code element tiles by radical.

Compound names are systematic too, which is worth surfacing: 氧化 = oxide,
氯化 = chloride, 硫酸 = sulfate, 碳酸 = carbonate. So 氧化铁 reads literally
"oxide-of-iron", and 硫酸铜 reads "sulfate-copper". A child can decode a new
compound name from parts they already know.

**Script: Simplified Chinese (简体) only.** Decided — do not add Traditional.
If that ever changes, note that most characters differ only in the metal radical
(钅→ 釒), but a few need real substitution, notably 硅 → 矽 (silicon).

### Elements 104–118: show the character, detect the font

All 118 elements display their real character. The 15 newest names
(𬬻 𬭊 𬭳 𬭛 𬭶 鿏 𫟼 𬬭 鿔 鿭 𫓧 镆 𫟷 鿬 鿫) were added to Unicode recently, and
9 of them sit outside the Basic Multilingual Plane, so some devices genuinely
cannot draw them.

Rather than assume either way, the site **asks the device at load time**
(`detectGlyphs()` in `app.js`): it paints each rare glyph to a canvas and
pixel-compares it against a codepoint guaranteed to be absent. Identical pixels
means a tofu box came back, and only those elements fall back to pinyin. On a
device with full font coverage every character shows.

`nameZhRareGlyph` in the data still marks which 14 to test — it is a "check this
one" flag, not "hide this one".

**These characters are worth showing, because they are readable.** Each is a
形声字: a radical saying what the element is, plus a phonetic saying how to say
it and who it honors. `zhCharacterNote` and `zhBuild` carry this for all 15:

| | Character | Built from | Honors |
|---|---|---|---|
| 104 Rf | 𬬻 lú | 钅 metal + 卢 | Rutherford 卢瑟福 |
| 106 Sg | 𬭳 xǐ | 钅 metal + 喜 | Seaborg 西博格 |
| 108 Hs | 𬭶 hēi | 钅 metal + 黑 | Hesse 黑森 |
| 109 Mt | 鿏 mài | 钅 metal + 麦 | Meitner 迈特纳 |
| 117 Ts | 鿬 tián | **石 solid nonmetal** + 田 | Tennessee 田纳西 |
| 118 Og | 鿫 ào | **气 gas** + 奥 | Oganessian 奥加涅相 |

Note the last two: tennessine is a halogen so it got 石, oganesson is a noble gas
so it got 气. Even for elements that existed for milliseconds in a lab, the
character still encodes the chemistry.

### Formulas are stored plain, rendered with subscripts

`elements.json` stores formulas as flat ASCII — `H2O`, `CuSO4·5H2O`. That keeps
them greppable and parseable. Subscripts are added at render time:
`fmtFormula()` in `site/app.js` for the web, and a matching `pretty()` in the
`ELEMENTS.md` generator that uses real Unicode subscripts (H₂O).

**The rule:** digits subscript only when they follow a letter, `)`, or `]`.
That one condition is what makes the tricky cases come out right —

| Stored | Rendered | Why |
|--------|----------|-----|
| `H2O` | H₂O | digit follows a letter |
| `CuSO4·5H2O` | CuSO₄·5H₂O | the leading 5 is a **coefficient**, not a subscript — it follows `·` |
| `KAl(SO4)2·12H2O` | KAl(SO₄)₂·12H₂O | same; 12 stays full size |
| `Cf-252 source` | Cf-252 source | isotope number follows `-`, untouched |
| `KRS-5` | KRS-5 | untouched |
| `TcO4−` | TcO₄⁻ | trailing charge becomes superscript |
| `TcH9^2−` | TcH₉²⁻ | `^` marks an explicit superscript |
| `(C2H3Cl)n` | (C₂H₃Cl)ₙ | polymer subscript n |
| `Grubbs catalyst` | Grubbs catalyst | no digits, left alone |

Some `formula` values are names rather than formulas (`Bronze`, `Wood's metal`,
`Grubbs catalyst`). The rule leaves them untouched. A sweep over all 971
formulas confirms none are mangled — rerun it if you change `fmtFormula()`.

### Other field notes

- `charges.common` is an **empty array** for elements with no known chemistry
  (Mt, Ds, Rg, Nh, Fl, Mc, Lv, Ts, Og). Handle the empty case — don't print
  a bare label with nothing after it.
- `group` is `null` for the 28 lanthanides and actinides. Expected, not missing data.
- `crustAbundancePpm` is `0` for purely synthetic elements and uses very small
  decimals for trace natural ones (astatine is `3e-24`). Format for display —
  raw values will render as unreadable float strings.
- `discovered.year` is `null` for the elements known since antiquity
  (C, S, Fe, Cu, Ag, Sn, Sb, Au, Hg, Pb); `discovered.by` reads
  "Known since ancient times" in those cases.
- Spelling and vocabulary are **American English** throughout — "aluminum",
  "cesium", "sulfur", "color", "gray", "meter", "fiber", "-ize" endings, and
  American word choices ("gasoline", "faucet", "flashlight", "cell phone").
  Keep any additions consistent with this. Note that "aluminum" and "sulfur"
  are also IUPAC-accepted, so the element names are scientifically correct
  as written.

## Sources

Oxidation states and crustal abundances were cross-checked against Wikipedia's
*Oxidation state* list and *Abundances of the elements (data page)*. Descriptions,
facts, and compound selections are original text written for this project.

Two caveats worth knowing:

- Crustal abundance figures vary between published sources, sometimes by a
  factor of two. These are order-of-magnitude correct and fine for teaching,
  but don't present them as precise.
- A few `charges.common` entries follow standard teaching convention rather than
  the strict Wikipedia bolding — e.g. gold is listed as `+1, +3` (both are
  commonly taught) where that table bolds only `+3`.

## Rebuilding

`elements.json` is generated by concatenating `data/part-01.json` … `part-06.json`
in order and wrapping them in the top-level object. The build also validates that
there are exactly 118 entries, that `atomicNumber` matches array position, that
symbols are unique, that every element has 5+ facts, and that any short compound
list has a `compoundsNote`.

To edit: change the relevant `data/part-*.json` shard, then re-run the merge.
Editing `elements.json` directly works but will be overwritten on the next build.

---

## The website

`site/index.html` is a single self-contained page — no build step, no dependencies,
no network requests. Open it directly or serve the folder.

**Live:** https://equn.me/elements/
**Artifact (preview copy):** https://claude.ai/code/artifact/511ecc0c-9025-4bf8-b497-5488b65084f9

Deploy with:

```bash
./deploy.sh
```

### Source files

| File | What it is |
|------|------------|
| `site/index.html` | **Generated.** The whole app in one file. Don't edit by hand. |
| `site/app.css` | Styles — edit this |
| `site/app.js` | App logic + song engine — edit this |
| `site/shell.html` | Page markup — edit this |
| `site/syllables.json` | Per-element syllable counts that drive the song's rhythm |
| `build.py` | Assembles the four into `site/index.html` |
| `deploy.sh` | Publishes `site/index.html` to https://equn.me/elements/ |

Rebuild after any edit:

```bash
python3 build.py
```

### What it does

- **Periodic table** in the real table shape; scrolls sideways inside its own
  container on phones so the page never scrolls sideways.
- **List view** for easier one-handed browsing.
- **Three color modes** — element family, Chinese radical, or solid/liquid/gas.
- **Search** across name, symbol, atomic number, Chinese character, and pinyin.
- **Element sheet** with the description, five facts, all compounds, and the
  radical explainer.
- **The song** — all 118 in atomic order, with the table lighting up in time.
- **Quiz** — seven question types generated from the data, never a fixed question bank.
- **Deep links** — `#Fe`, `#26`, and `#iron` all open iron. Shareable per element.

### Three things worth knowing before you edit

**1. The file is deliberately pure ASCII.** `build.py` escapes every non-ASCII
character (`\uXXXX` in JS, `&#xNNNN;` in HTML, `\XX` in CSS). The artifact host
supplies its own `<head>`, so we cannot declare a charset — if the host ever
served the page as anything but UTF-8, every Chinese character would turn to
mojibake. ASCII-only makes encoding irrelevant. Keep it that way; just write
normal characters in the source files and let `build.py` escape them.

**2. The viewport meta is declared twice on purpose.** Once in `shell.html` and
again injected at runtime by `app.js`. Same reason — we don't own `<head>`, and
without a viewport meta the page lays out at 980px wide on a phone, which is the
single most common way a "mobile-friendly" page isn't.

**3. `[hidden]` needs `!important`.** `.list { display: grid }` beats the
browser's built-in `[hidden] { display: none }` on specificity, which showed the
table and the 118-row list stacked on top of each other. The guard rule at the
top of `app.css` fixes it — don't remove it.

### The song

There is no audio file. The melody is synthesized with the Web Audio API at
playback time, which sidesteps the artifact CSP (it blocks every external host,
so a hosted MP3 could not load regardless of its license).

Rhythm comes from `site/syllables.json`: each element gets one eighth-note per
syllable, so "Zinc" is one beat and "Praseodymium" is five. The melody is a
patter contour in the style of **"I Am the Very Model of a Modern Major-General"**
(Sullivan & Gilbert, *The Pirates of Penzance*, 1879) — **public domain**.

To retune it, edit `PHRASES` in `app.js` (semitone offsets from the tonic) or
`EIGHTH` (note length). To swap in a real recording later, replace the synth
calls in `tone()` — but note it must be embedded as a data URI, not fetched.

### The quiz

Questions are generated from `elements.json` at runtime, so there is no question
bank to maintain — add an element fact and it becomes quizzable immediately.
Seven types in `QTYPES` (`app.js`): symbol&rarr;name, name&rarr;symbol,
Chinese&rarr;name, radical&rarr;category, atomic number, compound&rarr;element,
and fact&rarr;element.

Two things that are easy to get wrong if you edit it:

**Distractors come from the same family.** `peers()` prefers wrong answers from
the element's own category, so "which is Fe?" offers other transition metals
rather than a noble gas. Harder, and it teaches the families.

**Prompts are scrubbed for the answer.** Compound blurbs and fun facts routinely
name their own element ("the main ore that *titanium* is mined from"), which
hands over the answer. `QTYPES` replaces the element name and symbol in any
prompt text before showing it. A 600-question generated sweep asserts no leak,
no duplicate options, and exactly one correct answer — rerun that check after
editing question types.

Questions draw from `FAMILIAR`, a list of elements a 8-13 year old plausibly
meets, so the quiz never asks about darmstadtium. Widen it if you want a
harder mode.

**Credit where due:** singing the elements to that tune is Tom Lehrer's idea
("The Elements", 1959). Lehrer placed his lyrics in the public domain in 2020
and his recordings in 2022, so his original is usable too — it stops at 102
elements and runs in rhyme order rather than atomic order.

---

## Audit log

Full audit run against the data, the cross-file pipeline, chemistry, and the
live site. Six real defects found and fixed; recorded here so they don't recur.

### Fixed

| # | Area | Defect | Fix |
|---|------|--------|-----|
| 1 | Accessibility | Muted text (`--ink-3`) failed WCAG AA: **2.78:1** in light, 4.29:1 in dark, against a 4.5 requirement. Affected hints, credits, and every stat label. | Retuned to `#656e80` / `#7f88a1` — now 4.74:1 and 5.57:1 |
| 2 | Search | **Pinyin search was broken.** All 118 pinyin values carry tone marks, so typing `tie` for 铁 returned nothing — while the placeholder advertised `tiě`. | Strip tones from query and data before matching. All 118 now findable by toneless pinyin |
| 3 | Accessibility | Chips and controls were **31px** tall, under the 32px minimum | `min-height:36px`; zero controls now under 32px |
| 4 | Accessibility | No `lang` attribute, and Chinese ran untagged inside English — screen readers would spell 铁 letter by letter | `lang="en"` set at runtime; **121** Chinese runs tagged `lang="zh-Hans"` |
| 5 | Repo hygiene | `site/data.js` was a **stale leftover** from the first manual build. `build.py` stopped reading it, so it silently lacked the newest fields — a trap for the next editor | Deleted. `build.py` generates the payload inline from `elements.json` |
| 6 | Data | `CsFormate` was neither a formula nor a name | Corrected to `HCOOCs` |

### Verified clean

- **Data** — 118 elements, symbols/names/Chinese characters all checked against a
  reference table written independently of the data; no mismatches. Unique
  symbols, names, and characters. Groups, periods, masses, charges all valid.
- **Chemistry** — every compound formula contains its parent element (the 7
  exceptions are deliberate trade names: Terfenol-D, EDFA, MOX, Amalgam,
  Thiomersal, Purple of Cassius). Oxidation states spot-checked against
  textbook values for 23 elements: all match.
- **Consistency** — `data/part-*.json` == `elements.json` == the shipped payload
  == `ELEMENTS.md`, all 118 sections present.
- **Spelling** — zero British spellings across data, source, and docs.
- **Radicals** — the set of water-radical elements is *exactly* the set of
  liquid elements (Br, Hg). This is asserted, not assumed.
- **Site** — all 118 sheets open without error; 963 compounds; 300+ generated
  quiz questions with no answer leaks, duplicate options, or malformed sets;
  song plays and syncs; deep links resolve; **zero console errors**;
  **zero external requests** (CSP-safe).
- **Responsive** — no horizontal page scroll at 320px or 390px; the table keeps
  its scrolling inside its own container.
- **Theming** — all three states (system / explicit light / explicit dark) paint
  an explicit background; body is never transparent.
- **Performance** — 267 KB single file, DOM ready in ~22 ms, 579 nodes,
  full re-render in ~3 ms.

### Known and accepted

- The `formula` field sometimes holds a trade name (`Bronze`, `Wood's metal`,
  `Grubbs catalyst`). `fmtFormula()` leaves them alone. Documented rather than
  "fixed", since the alternative is inventing formulas for alloys.
- Crustal abundance figures vary between published sources by up to 2×. Fine
  for teaching; don't present them as precise.

---

## Deployment

```bash
./deploy.sh              # verify, preview, confirm, publish, purge CDN
./deploy.sh -n           # dry run - show what would change
./deploy.sh -y           # skip the confirmation prompt
./deploy.sh --no-purge   # skip the Cloudflare purge
```

**Live at https://equn.me/elements/** — rsync'd to `/www/wwwroot/equn.me/elements/`
on the NY box, via the shared `../vpshosts/deploy-lib.sh` that every other
equn.me sub-app uses. Needs `~/.config/vpsdeploy/secrets.env` for the Cloudflare
token, same as the siblings.

### Only two files are published

`site/index.html` and `site/.htaccess`, and nothing else. It is self-contained — CSS, JS and all 118
elements are inlined at build time — so `app.css`, `app.js`, `shell.html` and
`syllables.json` are **build sources** that would only ship a confusing second
copy of the site. The repo root (`elements.json`, `ELEMENTS.md`, `data/`) is the
database and its dev notes, not a website. So `deploy.sh` stages a one-file tree
rather than pointing rsync at `site/`.

If you ever want the dataset public too, add `elements.json` to the staging step
and link it from the credits — it is a genuinely nice thing to offer, it just
isn't reachable today.

### The preflight is the point

`index.html` is generated. The easy mistake is editing `app.js`, deploying, and
publishing a stale page that silently lacks the change. So the deploy refuses
unless:

- `index.html` is **newer than every build input** — verified to actually fire,
  not a decorative check
- it is **pure ASCII** — the Chinese is carried as `\uXXXX` escapes on purpose;
  a stray non-ASCII byte means someone bypassed `build.py`
- it declares a **viewport**, has a `<title>`, and still parses to **118**
  elements each with a Chinese name

`--skip-checks` bypasses all of it and prints a loud warning. Don't use it to
push past a failure.

### Verifying a deploy

`curl https://equn.me/elements/` returns **403 "Just a moment…"**. That is
Cloudflare's bot challenge answering curl, *not* a broken deploy — check it in a
real browser, or compare the file at the origin:

```bash
ssh ny 'sudo shasum -a256 /www/wwwroot/equn.me/elements/index.html'
shasum -a256 site/index.html
```

Post-deploy verification on 2026-08-18: sha256 identical local↔server, owned
`www:www` like its siblings, and on the live URL — 118 elements, Chinese
rendering (铁, 鿫), formula subscripts, tone-insensitive search, 150 generated
quiz questions clean, song playing, deep links resolving, no sideways scroll at
375px.


---

## Mobile: the element sheet

On a phone the element details open as a bottom sheet. Four things about it were
broken and are worth knowing before you change it:

- **Height uses `svh`, not `vh`.** On phones `vh` measures the viewport with the
  browser toolbars *hidden*, so a `92vh` sheet pushed its own header — name and
  close button — underneath Safari's address bar. `calc(100svh - 40px)` sizes to
  the viewport with toolbars *shown*, so the sheet always fits. `vh` stays as a
  fallback line for old engines.
- **The close button lives in a pinned bar** (`.sheet-bar`, `position: sticky`).
  It used to be absolutely positioned inside the scrolling sheet, so it scrolled
  away as soon as you read past the header. Once you scroll, the bar also shows
  a compact "Fe Iron 铁" title.
- **Swipe the bar down to close** (phones only; more than 90px closes, less snaps
  back). The grab handle had always suggested this and done nothing.
- **The page behind is frozen** while the sheet is open (`html.sheet-lock` plus
  `overscroll-behavior: contain`), so dragging the sheet no longer scrolls the table.

Also fixed in the same pass: in the phone card layout the 中文 compound name
inherited `width:100%`, dropped onto its own line, and pushed the list 8px wide —
that was the stray horizontal scrollbar under the compounds.

### Caching

The server used to send no `Cache-Control` on the page, only `Last-Modified`, so
browsers guessed a freshness window and phones kept showing the previous deploy
for days. `site/.htaccess` now sends `Cache-Control: no-cache` (revalidate every
visit; an unchanged page is a cheap 304). A browser that cached the page *before*
this header existed still needs one manual refresh.

Backups of the pre-change sources are in `backup/pre-mobile-sheet-*/` (not deployed).
