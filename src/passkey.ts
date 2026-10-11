// WebAuthn glue. The server speaks the standard JSON forms, so the browser's
// own parse*OptionsJSON / toJSON() do all the encoding (no dependency).
// ponytail: needs Chrome 129+/Safari 18.4+/Firefox 119+; older browsers get no
// passkey button — add @simplewebauthn/browser if that matters.

export const passkeysSupported: boolean =
  typeof window !== "undefined" &&
  "PublicKeyCredential" in window &&
  "parseCreationOptionsFromJSON" in PublicKeyCredential;

type Options = { publicKey?: unknown } | undefined;

// null = the user dismissed the prompt (not an error worth showing).
async function ceremony<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotAllowedError") return null;
    throw e;
  }
}

export function createPasskey(
  options: Options,
): Promise<Record<string, unknown> | null> {
  return ceremony(async () => {
    const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(
      options?.publicKey as PublicKeyCredentialCreationOptionsJSON,
    );
    const cred = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;
    return cred.toJSON() as Record<string, unknown>;
  });
}

export function getPasskey(
  options: Options,
): Promise<Record<string, unknown> | null> {
  return ceremony(async () => {
    const publicKey = PublicKeyCredential.parseRequestOptionsFromJSON(
      options?.publicKey as PublicKeyCredentialRequestOptionsJSON,
    );
    const cred = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;
    return cred.toJSON() as Record<string, unknown>;
  });
}
