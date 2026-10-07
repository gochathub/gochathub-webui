# Brand implementation requirements

Source of truth: the goChatHub logo pack (copied, byte-identical, from
`~/projects/gochathub-logo-pack/`). Canonical home of all brand assets:
`~/projects/gochathub-assets/`; the webui repo vendors only the files it
consumes.

Brand note (`BRAND.md` in the pack): neutral palette — charcoal `#27313A`,
slate `#71808E`, light slate `#AAB4BC`, dark background `#182027`, white.
The UI keeps its existing indigo accent; brand marks use `currentColor` /
pack colors, not a new accent system.

## Requirements

1. **Canonical assets home** — pack contents copied to
   `~/projects/gochathub-assets/` (README, BRAND.md, svg/, png/, as-is).
   Repo copies live only in `src/assets/brand/` + `public/`.
2. **Browser chrome** — `index.html` references the real icon/favicon set:
   `favicon.ico`, PNG 16/32/48, `apple-touch-icon-180`, inline icon SVG at
   `/vectors/gochathub.svg`; `theme-color` from the dark background.
   Placeholder "gH" SVG deleted.
3. **In-app mark** — `Wordmark.vue` becomes icon + `goChatHub` text (icon
   inlined, `currentColor`, sizes sm/md/lg preserved). Call sites
   (`Logo.vue`, `Cover.vue`, `LoginForm.vue`) need no separate edits.
4. **Login cover** — template clouds/blur art dropped; brand charcoal panel
   with the hub-icon styling; pack wordmark lockup fits existing copy.
5. **Cleanup** — remove `src/assets/images/{blur,clouds}.png` (no longer
   referenced) and unused `thumbnail.png`; delete duplicate pack extraction
   `gochathub-logo-pack (2)/` + `.zip` only on explicit confirmation.

## Acceptance

- `bun run typecheck` + lint pass; build resolves no missing assets.
- Dev server shows real favicon, icon+wordmark nav, brand cover, no console
  errors on login/home.
- Zero repo references to deleted template images.

## Explicit non-goals

- No PWA manifest, no new dependencies, no palette retheme of the UI.
- No repo-internal duplication of the full pack.