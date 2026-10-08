// The Android app's QR payload: gochathub://login?server=<origin>&token=<key>.
// The app (gochathub-android-client) parses exactly these two parameters.
export function mobileSignInUrl(server: string, token: string): string {
  const u = new URL("gochathub://login");
  u.searchParams.set("server", server);
  u.searchParams.set("token", token);
  return u.toString();
}
