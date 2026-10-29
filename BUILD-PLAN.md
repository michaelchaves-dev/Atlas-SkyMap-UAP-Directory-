# ATLAS SkyMap — Build Plan

Status of this document: plan for the public preview launched 2026-10-28. The private working repo is `ATLAS_uap-app`; this public repo is the storefront / register.

## What we found on inspection (2026-10-28)

- **This public repo** was an empty preview shell: README title + IP notices only, no code. Parked / shelved in the Oct 26 master inventory.
- **Private `ATLAS_uap-app`** has exactly one real, working component: a 1,067-line Gradio transit-camera ingestion app (`app.py` + `camera_taxonomy_schema.json`) merged in via a Cursor PR. It is a transit-camera dashboard, **not** the UAP product in its description — a credibility hazard if shown under the ATLAS name.
- Everything else in the private repo (`atlas_app/` — FastAPI entrypoint, services, schemas, templates, tests) is a placeholder stub containing literally `FULL CONTENT OF <file> FROM THE ATTACHMENT`. None of it runs.
- The private `.env.example` and `docs/data-model.md` do describe a real intended v1: Supabase/PostGIS tables (anomalies, reports, camera_feeds, satellite_telemetry), Stytch magic-link auth, Stripe tiers (Observer / Operator / Founding), CelesTrak satellite correlation, NOAA space weather, coordinate encryption, tier rate limits. That spec is the roadmap below — it is **not** built yet.

## Phase 1 — Public preview (this build, 2026-10-28)

Static, no build step, Vercel-ready: interactive Leaflet sky map, 12 sourced seed entries, searchable/filterable register, record detail with correlation notes, local-only report form (Pending review), directory of established reporting channels, verification-method explainer. Purpose: something real to show, promote and link — today.

## Phase 2 — Live layers (no accounts needed)

- CelesTrak TLE fetch + pass prediction for a selected entry's time/place; show "satellites overhead then" on the record.
- NOAA SWPC space-weather summary for the entry date.
- Both are public APIs, cacheable, and can run as small serverless functions on Vercel.

## Phase 3 — Reviewed submissions

- Supabase (per the private data-model) with a moderation queue: public report → pending → reviewed → register.
- Coordinate privacy: store exact coordinates privately, publish a fuzzed public location (the private spec's AES-GCM coordinate service is designed for this; it needs to actually be written).

## Phase 4 — Accounts & revenue

- Stytch magic-link auth; tiers from the private spec: Free (browse + limited reports), Observer, Operator, Founding seats.
- Stripe products exist as a script stub in the private repo — create in test mode first, verify, then live. No prices are published until Michael sets them.

## Guardrails

- Never present the transit-camera Gradio app as the UAP product.
- Every register entry names a source; no entry is labelled beyond what its correlation note supports.
- No push, merge, deploy or price goes live without Michael's go on the exact item.
