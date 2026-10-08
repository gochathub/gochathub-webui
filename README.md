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

Accounts are CLI-managed (no signup): `chat-server user create <name>
--display-name "Name" --role admin --password-stdin -` (type password, Enter).

Attachment uploads need object storage (S3) — `ALLOW_UPLOADS` without
storage configured returns an error the UI surfaces.

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
- Rocket.Chat TOTP enrollments are imported by server migration `003_totp.sql`
  (email-2FA is not carried over). Imported backup codes are unverified — if
  one fails, regenerate.

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
bun test tests/markdown.test.ts
GOCHATHUB_SMOKE=http://localhost:18100 GOCHATHUB_SMOKE_PASS=… bun test tests/smoke/
bun run generate-schema  # openapi-typescript from api/openapi.yaml
```

## Layout

```
src/api/          openapi-fetch client, generated schema.d.ts, mappers, markdown renderer
src/turnstile.ts  Turnstile script loader + site key (VITE_TURNSTILE_SITE_KEY)
src/ws/           WebSocket client (frames per docs/WEBSOCKETS.md) + session lifecycle
src/store/        Pinia stores: chat (UI state), rooms, contacts, invites, prefs, auth
src/components/   template UI adapted to the server model
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
