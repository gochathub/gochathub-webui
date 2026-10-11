# gochathub-webui

Web client for **goChatHub** ([gochathub-server](https://github.com/gochathub/gochathub-server)) — a
fork of [Avian-Template](https://github.com/daemon-bixia/Avian-Template) with
the mocked data layer replaced by the real API (Vue 3 + Pinia + vue-router +
Tailwind 4 + Vite; TypeScript strict; bun).

Authoritative inputs: `docs/CLIENT_BRIEF.md` + `api/openapi.yaml` (snapshot,
kept in sync with the server's contract — see `CONTRACT.md`).

## Development

Requires the backend running plus Postgres. Local dev setup used while
building (ports chosen to dodge docker conflicts on this machine):

```sh
# postgres (docker)
docker run -d --name gochat-db -e POSTGRES_USER=chatdev -e POSTGRES_PASSWORD=chatdev \
  -e POSTGRES_DB=chatdev -p 127.0.0.1:5532:5432 postgres:16-alpine

# server
cd ../gochatserver
DATABASE_URL=postgres://chatdev:chatdev@127.0.0.1:5532/chatdev \
  COOKIE_SECURE=false ORIGIN=http://localhost:5174 LISTEN_ADDR=:18100 \
  ./bin/chat-server migrate && ./bin/chat-server serve

# web client (proxies /api → localhost:18100, ws upgrade included)
bun install
bun run dev   # http://localhost:5174
```

There is no open signup. Accounts are created by an admin: the CLI
(`chat-server user create <name> --display-name "Name" --role admin
--password-stdin -`, type password, Enter) or an emailed signup invite (below).

Attachment uploads need object storage (S3) — `ALLOW_UPLOADS` without
storage configured returns an error the UI surfaces.

## Features beyond the template

- **Layouts:** modern (template) and classic (compact sidebar and room list,
  desktop and mobile). Per-user preference with `instance` meaning the admin default;
  resolved by `resolveLayout` in `store/prefs.ts`.
- **Installable PWA + Web Push:** `vite-plugin-pwa` (injectManifest), service
  worker in `src/sw.ts`, push registration in `src/push.ts`. An update toast
  offers upgrade/later; the WebSocket notification path stands down while push
  is registered.
- **Passkeys:** passkey sign-in, passkey management in Settings → Account, and
  an Android browser handoff page (`/access/:method/`).
- **Mobile sign-in QR:** Settings → Account creates a personal API token and
  shows it once as a `gochathub://login?...` QR; tokens can be listed and revoked.
- **Signup invites + admin area:** `/signup` consumes an invite token from the
  URL fragment; `/admin` (admins only) manages invites and email delivery
  (Postmark, SES, Mailgun, SendGrid, Resend, Brevo, SMTP; provider fields come
  from the server).
- **Composer:** Tiptap editor, `:shortcode:` emoji autocomplete and picker,
  optional Harper grammar/spelling check (wasm lazy-loaded, toggle and
  dictionary sync via server preferences).
- **In-app help:** `/help/:slug?`, pages from `docs/help/*.md`, contextual links.

## Rocket.Chat link

Optional — only relevant if you have a Rocket.Chat account you want to see in
goChatHub; everyone else can skip this section. This is an independent
integration, not affiliated with or endorsed by Rocket.Chat Technologies Corp.

Settings → Integrations links your own Rocket.Chat workspace: workspace URL,
RC user id (or username) and a Personal Access Token. The token goes to the
server once and is never read back. The server mirrors your direct messages,
private groups and channels as rooms in your list (channels appear as
owner-only private rooms), backfills history, and posts your replies through to
Rocket.Chat. Thread replies are not supported in mirrored rooms. Unlinking
hides the mirrored rooms; re-linking restores them.

The section is hidden when the server has no `RC_PAT_KEY` (the link endpoint
404s). Server settings: `RC_PAT_KEY` (encrypts stored tokens), optional
`RC_BASE_URL` default, `RC_ALLOW_HOSTS`, `RC_SYNC_INTERVAL` (see the server's
`docs/ROCKETCHAT-INTEGRATION.md`). State lives in `store/integrations.ts`.

## Two-factor authentication (TOTP)

Optional per user; users manage it in Settings → Account → Two-factor
authentication.

- **Set up:** scan the QR code (or enter the secret) in an authenticator app,
  confirm with a 6-digit code, then save the 10 one-time backup codes — they
  are shown once.
- **Sign-in:** after the password, a 2FA account gets a second step that
  accepts a TOTP code or an unused backup code. The server returns
  `two_factor_required` with a short-lived challenge (5 minutes, 5 attempts);
  the UI redeems it at `POST /auth/login/2fa`. No session exists until both
  steps pass.
- **Manage:** regenerate backup codes (needs a current code) or turn 2FA off
  (needs the password and a code).
- **Lost device:** an admin runs `chat-server user 2fa-reset <username>` on
  the server; it removes the factor and revokes the user's sessions.

Flow lives in `store/auth.ts` (`login`, `login2fa`, `setupTwoFactor`,
`enableTwoFactor`, `regenerateBackupCodes`, `disableTwoFactor`); UI in
`LoginForm.vue` and `TwoFactorSettings.vue`.

## Cloudflare Turnstile (login bot protection)

The login form shows a Turnstile widget and keeps **Sign in** disabled until it
returns a token. The token is single-use, so the widget resets after every
password attempt. The server verifies it against Cloudflare `siteverify`
before checking the password and answers `403 captcha_failed` when it is
missing or rejected. `/auth/login/2fa` is not gated.

The widget is active only when a site key is built in:

| Where      | Setting                   | Notes                                                                                                             |
| ---------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Web build  | `VITE_TURNSTILE_SITE_KEY` | Public key. Read at build time; unset = no widget. Put it in `.env.production` (gitignored) for production builds |
| Dev server | `VITE_ALLOWED_HOSTS`      | Comma-separated public hostnames the Vite dev/preview server accepts (IPs and localhost are always allowed)       |
| Server env | `TURNSTILE_SECRET`        | Secret key; unset = server skips the check. Never commit it                                                       |
| Server env | `TURNSTILE_HOSTNAME`      | Optional: pin tokens to this site's hostname                                                                      |

The widget's hostname list in the Cloudflare dashboard must include the
deployment hostname.

For development, use Cloudflare's published test keys (always pass, banner
"For testing only"): site key `1x00000000000000000000AA` in the Vite env and
secret `1x0000000000000000000000000000000AA` in the server env. Leaving both
unset disables Turnstile entirely.

## Commands

```sh
bun run dev         # dev server
bun run build       # vue-tsc + vite build
bun run typecheck   # strict TS against the generated schema
bun run lint        # eslint (TS-aware)
bun test tests/       # unit tests (smoke suite below needs a server)
GOCHATHUB_SMOKE=http://localhost:18100 GOCHATHUB_SMOKE_PASS=… bun test tests/smoke/
bun run generate-schema  # openapi-typescript from api/openapi.yaml
```

## Layout

```
src/api/          openapi-fetch client, generated schema.d.ts, mappers, markdown renderer
src/turnstile.ts  Turnstile script loader + site key (VITE_TURNSTILE_SITE_KEY)
src/ws/           WebSocket client (frames per docs/WEBSOCKETS.md) + session lifecycle
src/push.ts       Web Push subscribe/teardown; src/sw.ts is the service worker
src/store/        Pinia stores: chat (UI state), rooms, contacts, invites, prefs, auth,
                  integrations (Rocket.Chat), signupInvites, mailSettings, uiSettings
src/components/   template UI adapted to the server model (classic/ = classic layout)
docs/help/        in-app help pages (markdown)
```

## Conventions worth knowing

- IDs are opaque strings everywhere (server UUIDs).
- Error handling switches on envelope `code`; `message` is display text.
- Pagination follows `next_cursor` (newest page first, no offsets).
- Receipts per ADR-009: own message shows the aggregate read/delivered state;
  your receipts show on messages you receive but are never rendered.
- Cookie sessions (ADR-015); single origin through the proxy (ADR-016).
- Strip decisions (voice calls, signup, link previews) live in the brief;
  deliberate deviations and their reasons are recorded in `CONTRACT.md`.

## Known gaps (one-pass build)

- Attachment upload code path is complete but unverified against real object
  storage (no S3 available locally while building); UI surfaces the
  "storage not available" error. Same for avatar upload.
- Reactions: WS events are received/deduped; reaction chips don't render yet.
- Group admin actions (invite/remove members from the info modal) wired but
  not exhaustively tested.

## Support

Community help is free through [GitHub issues](https://github.com/gochathub/gochathub-webui/issues). Paid installation, Rocket.Chat migration and maintenance are available: see [gochathub.com/support](https://gochathub.com/support/).

## Contributing and security

See the [contributing guide](https://github.com/gochathub/.github/blob/main/CONTRIBUTING.md) and [code of conduct](https://github.com/gochathub/.github/blob/main/CODE_OF_CONDUCT.md). Report vulnerabilities privately through the Security tab, not in issues: [security policy](https://github.com/gochathub/.github/blob/main/SECURITY.md).

## License

[MIT](LICENCE). The UI is a fork of
[Avian-Template](https://github.com/daemon-bixia/Avian-Template) © 2021
Muhammad Salah (MIT).

## Acknowledgements and trademarks

- [Avian-Template](https://github.com/daemon-bixia/Avian-Template) provides the
  UI base.
- The classic layout is inspired by the interface of
  [Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) (MIT, outside its
  `ee/` directories). No Rocket.Chat code or assets are used, and the optional
  link feature talks only to Rocket.Chat's public REST API via the server.

goChatHub is an independent project, not affiliated with, endorsed by, or
sponsored by Rocket.Chat Technologies Corp. Rocket.Chat is a trademark of
Rocket.Chat Technologies Corp.; Cloudflare and Turnstile are trademarks of
Cloudflare, Inc. Third-party names are used only to identify compatibility.
