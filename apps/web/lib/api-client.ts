const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

type RequestOptions = RequestInit & {
  tenantId?: string;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function browserStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("procuflow_token") ? window.sessionStorage : window.localStorage;
}

export function saveSession(token: string, tenantId: number | string, remember = false) {
  if (typeof window === "undefined") return;
  const target = remember ? window.localStorage : window.sessionStorage;
  const other = remember ? window.sessionStorage : window.localStorage;
  other.removeItem("procuflow_token");
  other.removeItem("procuflow_tenant_id");
  target.setItem("procuflow_token", token);
  target.setItem("procuflow_tenant_id", String(tenantId));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem("procuflow_token");
    storage.removeItem("procuflow_tenant_id");
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const storage = browserStorage();
  const token = storage?.getItem("procuflow_token");
  const tenantId = options.tenantId ?? storage?.getItem("procuflow_tenant_id") ?? undefined;
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (tenantId) headers.set("X-Tenant-ID", tenantId);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as ApiErrorPayload;
    const firstValidationError = Object.values(payload.errors ?? {})[0]?.[0];
    throw new ApiError(firstValidationError ?? payload.message ?? "Une erreur est survenue.", response.status, payload.errors);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string }> {
  const storage = browserStorage();
  const headers = new Headers({ Accept: "text/csv" });
  const token = storage?.getItem("procuflow_token");
  const tenantId = storage?.getItem("procuflow_tenant_id");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (tenantId) headers.set("X-Tenant-ID", tenantId);

  const response = await fetch(`${API_BASE_URL}${path}`, { headers, cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as ApiErrorPayload;
    throw new ApiError(payload.message ?? "Export impossible.", response.status, payload.errors);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "procuflow-report.csv";
  return { blob: await response.blob(), filename };
}
