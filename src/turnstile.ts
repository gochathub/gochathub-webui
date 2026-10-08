// Cloudflare Turnstile loader (explicit rendering). The site key is public
// and comes from the build env; unset = the login form shows no widget.

export const turnstileSiteKey: string | undefined = import.meta.env
  .VITE_TURNSTILE_SITE_KEY;

export interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | undefined;

export function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve(window.turnstile!);
    s.onerror = () => {
      loading = undefined; // allow a retry on the next mount
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}
