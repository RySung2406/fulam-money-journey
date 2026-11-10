---
name: FuLam Money Journey
description: Warm paper and forest-green programme site for the HKU 21-day money journey
colors:
  forest-ink: "#214b3b"
  forest-ink-deep: "#17392b"
  warm-paper: "#f6f5ef"
  cream-white: "#fffef9"
  amber-accent: "#ed9858"
  amber-highlight: "#edb579"
  soft-muted: "#59675e"
  quiet-line: "#d9ded5"
  focus-ring: "#a95520"
typography:
  display:
    fontFamily: "Inter, \"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", system-ui, sans-serif"
    fontSize: "clamp(54px, 5.8vw, 80px)"
    fontWeight: 650
    lineHeight: 1.13
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, \"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", system-ui, sans-serif"
    fontSize: "clamp(28px, 3.4vw, 38px)"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, \"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, \"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, \"Noto Sans TC\", \"PingFang TC\", \"Microsoft JhengHei\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "22px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "55px"
components:
  button-primary:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.cream-white}"
    rounded: "{rounded.sm}"
    padding: "15px 24px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.forest-ink-deep}"
    textColor: "{colors.cream-white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.sm}"
    padding: "15px 24px"
    height: "54px"
  button-amber:
    backgroundColor: "{colors.amber-accent}"
    textColor: "{colors.forest-ink-deep}"
    rounded: "{rounded.sm}"
    padding: "15px 24px"
  input-field:
    backgroundColor: "{colors.cream-white}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.md}"
    height: "58px"
    padding: "0 17px"
  card-surface:
    backgroundColor: "{colors.cream-white}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.lg}"
    padding: "28px"
  check-in-panel:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.cream-white}"
    rounded: "{rounded.xl}"
    padding: "34px 38px"
---

# Design System: FuLam Money Journey

## Overview

**Creative North Star: "The Green Money Carriage"**

FuLam’s visual world is a warm campus programme desk rendered as a quiet journey vehicle: ivory paper fields, deep forest ink, and a careful amber spark for momentum. It should feel trustworthy and readable on a phone between classes—never flashy, never corporate-purple AI default.

Personality is warm, clear, and credible. Public pages use soft paper surfaces and large editorial headlines; My Journey and check-in lean on solid forest panels so tasks feel grounded. Motion is brief and respectful of `prefers-reduced-motion`.

**Key Characteristics:**
- Warm ivory paper + forest green ink as the identity pair
- Amber used sparingly for energy, eyebrows, and prize accents
- Large, bilingual-friendly sans type with generous body leading
- Soft radii (8–22px), mostly tonal depth instead of heavy shadows
- Programme honesty over decorative spectacle

## Colors

A restrained programme palette: deep green authority on warm paper, with amber as the rare spark.

### Primary
- **Forest Ink** (#214b3b): Brand, primary buttons, check-in panels, sticky header contrast marks. The main voice of FuLam.
- **Forest Ink Deep** (#17392b): Primary hover / pressed deepening of Forest Ink.

### Secondary
- **Amber Accent** (#ed9858): Eyebrow rules, amber CTAs, brand-mark gold, selection tint. Use sparingly so the journey still feels calm.
- **Amber Highlight** (#edb579): Reveal badges, calendar “open” days, prize warmth on dark panels.

### Neutral
- **Warm Paper** (#f6f5ef): Page background.
- **Cream White** (#fffef9): Cards, inputs, elevated sheets on paper.
- **Soft Muted** (#59675e): Supporting copy, footnotes, secondary labels.
- **Quiet Line** (#d9ded5): Hairline borders and header/footer rules.
- **Focus Ring** (#a95520): `:focus-visible` outline only.

**The One Spark Rule.** Amber appears as punctuation (eyebrow bars, rare CTAs, reveal accents)—not as a second full theme competing with Forest Ink.

## Typography

**Display Font:** Inter with Noto Sans TC / PingFang TC / Microsoft JhengHei fallbacks  
**Body Font:** Same stack (single family system for bilingual campus use)

**Character:** Practical and campus-readable; large headlines carry the editorial weight while body stays open and calm for Traditional Chinese.

### Hierarchy
- **Display** (650, clamp ~54–80px, ~1.13): Homepage hero titles.
- **Headline** (650, clamp ~28–38px, ~1.35): Section and dashboard titles.
- **Title** (650, ~29px, 1.4): Onboarding card titles, feature heads.
- **Body** (400, 18px desktop / 17px phone, 1.8): Default reading text.
- **Label / Eyebrow** (700, 14px, letter-spacing ~0.1em, uppercase English allowed): Section eyebrows and meta.

**The Readable Campus Rule.** Prefer open leading and clear contrast over dense “dashboard” type; bilingual lines must stay legible at phone widths.

## Layout

Centered container (`width: calc(100% - 64px)`, max ~1240px; tighter gutters below 760px). Public homepage uses a two-column hero that stacks on mobile. My Journey uses a split auth shell that becomes a single column on small screens. Section rhythm is generous (~40–65px), with sticky header (~72–88px) and a fixed mobile bottom nav on public pages.

Spacing scale leans on 8 / 16 / 24 / 40px steps. Density is editorial-light, not admin-dense.

## Elevation & Depth

Mostly **tonal layering**: paper → cream cards → forest panels. Shadows are soft and rare (button hover `0 7px 20px #214b3b1a`, occasional card whisper). Borders (`Quiet Line`) do more work than drop shadows.

**The Flat-By-Default Rule.** Surfaces rest flat; lift only on hover/focus or when a dark forest panel needs a soft outer whisper.

## Shapes

Gently rounded language: controls ~8–10px, cards ~16–20px, major panels ~22–24px, pills/status chips full radius. Circular brand mark. Avoid sharp zero-radius newspaper layouts and oversized “AI pill” clusters.

## Components

### Buttons
- **Shape:** Soft rectangle (~8–10px)
- **Primary:** Forest Ink fill, cream text, ~54px tall; hover deepens to Forest Ink Deep with a light shadow and slight lift
- **Outline:** Transparent with Forest Ink border
- **Amber:** Amber Accent fill for rare emphasis CTAs
- **Text link:** Underlined weight-650 inline action

### Cards / Containers
- **Corner Style:** ~16–22px
- **Background:** Cream White on Warm Paper, or inverted Forest Ink for check-in
- **Border:** Quiet Line / soft green-gray
- **Shadow Strategy:** Minimal; prefer border + tone
- **Internal Padding:** ~28–42px on desktop cards

### Inputs / Fields
- **Style:** Cream field, ~10px radius, 58px height, quiet border
- **Focus:** Soft green outer ring (`box-shadow: 0 0 0 3px #e5eddf`) plus darker border
- **OTP:** Large tabular figures with wide letter-spacing

### Navigation
- Sticky translucent paper header; desktop text links with underline grow; mobile menu + bottom tab bar
- Journey steps as bordered cream buttons with circular day numbers; current step uses aria-current

### Signature: Check-in panel
Dark Forest Ink stage for the 21-day calendar and questions. Open days use Amber Highlight cells; completed days use light cream. Revealed answers sit in a bordered amber reveal box so they never blend into the question.

## Do's and Don'ts

### Do:
- **Do** keep Forest Ink + Warm Paper as the identity pair on every major surface.
- **Do** reserve Amber for eyebrows, rare CTAs, open-day states, and answer reveals.
- **Do** preserve bilingual clarity and large tap targets (≥44px) on phone.
- **Do** honor `prefers-reduced-motion` by collapsing nonessential motion.
- **Do** keep programme/prize facts visually quieter than CTAs—accurate, not flashy.

### Don't:
- **Don't** introduce purple-indigo “AI default” gradients or neon glow stacks.
- **Don't** replace the warm paper field with flat pure white or a dark-mode theme without an explicit redesign.
- **Don't** nest heavy card-in-card chrome on the homepage hero.
- **Don't** show prize/answer spoilers outside their intended panels.
- **Don't** invent Inter-only English styling that breaks Traditional Chinese readability.
