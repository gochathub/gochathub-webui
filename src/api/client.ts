import createClient from "openapi-fetch";
import { paths } from "./schema";

export type ApiClient = ReturnType<typeof createOpenApiClient>;

// Stable error codes from the server envelope; UI switches on `code`,
// `message` is only for display.
export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limited"
  | "two_factor_required"
  | "internal";

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  // two_factor_required only: redeem at POST /auth/login/2fa
  challenge?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    challenge?: string,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.challenge = challenge;
  }
}

// Request id for correlation — getRandomValues works in insecure contexts
// (crypto.randomUUID is secure-context-gated; LAN http origins lose it).
function requestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return hex;
}

function client(server: string) {
  return createClient<paths>({
    baseUrl: server,
    fetch(request) {
      request.headers.set("X-Request-ID", requestId());
      return window.fetch(request);
    },
  });
}

// ponytail: same-origin only (single origin through the proxy, ADR-016);
// no cross-origin or retry handling — the reverse proxy owns transport.
// Base path comes from the contract `servers` entry (/api/v1); VITE_API_BASE
// replaces it for tests against a standalone server (include the /api/v1).
export function createOpenApiClient(
  server = import.meta.env.VITE_API_BASE ?? "/api/v1",
) {
  return client(server);
}

export default createOpenApiClient();

// Error envelope: { "error": { "code": ..., "message": ... } } on non-2xx.
export interface ErrorEnvelopeResult<E> {
  data?: never;
  error: E;
  response: Response;
}

export async function unwrap<
  T,
  E extends { error: { code: string; message: string } },
>(result: {
  data?: T;
  error?: E;
  response: Response;
}): Promise<Exclude<T, undefined>> {
  if (result.error) {
    throw new ApiError(
      result.error.error.code as ApiErrorCode,
      result.error.error.message,
      result.response.status,
      (result.error.error as { challenge?: string }).challenge,
    );
  }
  return result.data as Exclude<T, undefined>;
}
