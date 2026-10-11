// The Android app's QR payload: gochathub://login?server=<origin>&token=<key>.
// The app (gochathub-android-client) parses exactly these two parameters.
// Browser→app handoff (Custom Tab): a one-time code the app redeems with its
// PKCE verifier, plus the app's `state` echoed back.
export function mobileHandoffUrl(
  server: string,
  code: string,
  state: string,
): string {
  const u = new URL("gochathub://login");
  u.searchParams.set("server", server);
  u.searchParams.set("code", code);
  u.searchParams.set("state", state);
  return u.toString();
}

export function mobileSignInUrl(server: string, token: string): string {
  const u = new URL("gochathub://login");
  u.searchParams.set("server", server);
  u.searchParams.set("token", token);
  return u.toString();
}
