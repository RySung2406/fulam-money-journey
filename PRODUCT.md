# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are current HKU students joining the 21-day FuLam Money Journey programme: they sign in with HKU email, complete surveys, join WhatsApp, check in daily, and may visit campus booths for prizes.

Secondary audiences may browse public games, Instagram, and WhatsApp, but check-ins, prize eligibility, and booth rewards are for HKU students only.

## Product Purpose

FuLam Money Journey (富臨錢進號) is a student-run personal finance education programme site. It helps HKU students build money habits over 21 days by learning in WhatsApp and returning to the website to check in, play educational games, and complete pre-/post-surveys.

Success means participants join the WhatsApp community, keep checking in (target: at least 17 of 21 days / 80%), complete both surveys, and become eligible for the prize draw / booth rewards.

## Positioning

Learning happens in WhatsApp (questions, explanations, discussion); the website is the journey home for verified HKU identity, daily check-in records, surveys, public arcade games, and campus booth entry—not a standalone content CMS or investment product.

## Operating Context

- Public homepage → WhatsApp invite, Instagram, games, programme credits
- My Journey (`/account/`): HKU email OTP → pre-survey → WhatsApp → 21-day check-in → booth
- Microsoft Forms for pre- and post-surveys (site does not verify Forms completion)
- Check-in answers reveal only after a member opens a completed day and the reveal is due
- Public games (One Slice, Catch, Wings) need no sign-in; booth mode is timed for campus play
- Deployed at GitHub Pages; auth/data on Supabase; bilingual zh-Hant / English

## Capabilities and Constraints

- HKU member email domains only for programme access: `@connect.hku.hk`, `@graduate.hku.hk`, `@hku.hk`
- Session persists in the same browser; OTP required again after sign-out, private mode, or cleared storage
- Prize draw requires ≥80% check-ins (17/21) and completing pre- and post-surveys
- Site must not invent prize rules, dates, or Forms links; keep published eligibility accurate
- Content categories may stay “coming soon” until real releases exist; do not fake published media
- Stack is established: static HTML/CSS/JS site under `site/`, Node tooling, Supabase Auth + RLS, GitHub Pages deploy

## Brand Commitments

Confirmed by the product owner—do not change without explicit approval:

- Brand names: 富臨錢進號 / FuLam / FuLam Money Journey; student team 搏富臨
- Bilingual interface (Traditional Chinese + English)
- HKU email sign-in restriction for programme features
- Official Personal Finance Ambassador Programme / IFEC programme identity and credits must stay accurate
- Prize and 80% eligibility copy must stay factually correct

## Evidence on Hand

- Live site: https://rysung2406.github.io/fulam-money-journey/
- Programme copy, partner logos, prize images under `site/assets/`
- Check-in curriculum in `site/check-in-content.js` (answers server-side until revealed)
- Public games under `site/game/`, `site/fishing/`, `site/fleet/`, `site/booth/`
- No fabricated testimonials, enrollment stats, or unverified content URLs

## Product Principles

1. **Journey over brochure** — Design should push verified students into WhatsApp + check-in, not just look informative.
2. **Honest programme facts** — Eligibility, prizes, surveys, and institutional credits stay accurate; never invent proof.
3. **Public play, verified rewards** — Games can welcome everyone; rewards and check-ins stay HKU-gated and clear.
4. **Same-browser continuity** — Returning members should feel remembered without redoing OTP unless they signed out.
5. **Bilingual clarity** — Chinese and English must both stay clear for campus use.

## Accessibility & Inclusion

Prefer readable type, clear focus states, and `prefers-reduced-motion` respect already present on the public site. No additional legal standard was confirmed beyond keeping programme access understandable for HKU students on phone and desktop.
