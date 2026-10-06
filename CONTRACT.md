# Contract change log (api/openapi.yaml snapshot)

Deliberate changes made server-side first, then snapshotted here — same PR
as the feature that needed them (brief §Contract authority).

## 2026-10-06 — one-pass build batch

| Change | Why |
| --- | --- |
| `GET /rooms` 200 → `Room[]` schema declared | Response always was a JSON Room array; codegen needs the declared shape. |
| `Room.archived` (bool) added | Caller's member-level archive flag; the sidebar splits active/archive without extra calls. Server: list + get joined `room_members.archived`. |
| `Message.author` (`User`, optional) declared | Payloads hydrate the author; clients use the name/avatar without a second lookup. |
| `CreateRoomRequest.type` enum widened to `public/private/direct/group_direct`, `members[]` added | Server Create always accepted all types + co-members; the schema lagged. |
| `PATCH /users/me/password` added (`ChangePasswordRequest`) | Self-service change (ADR-014 unchanged: forgotten passwords stay a CLI reset; CLI `user passwd` remains). Server revokes all sessions on success. |
| WebSocket upgrades accept an Origin matching server `BaseOrigin` | Proxied deployments: Host is the backend, Origin is the public origin — coder's same-origin default rejected upgrades (403). Mirrors the HTTP same-origin middleware (ADR-016). |