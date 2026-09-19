const DEFAULT_BACKEND_URL = "http://localhost:8000";

export interface ApiClientConfig {
  backendUrl: string;
  useMocks: boolean;
}

export const apiConfig: ApiClientConfig = {
  backendUrl: import.meta.env["VITE_AGENTSHIELD_API_URL"] ?? DEFAULT_BACKEND_URL,
  useMocks: import.meta.env["VITE_AGENTSHIELD_USE_MOCKS"] !== "false",
};

export class AgentShieldApiError extends Error {
  status?: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AgentShieldApiError";
    this.status = status;
  }
}

export async function mockDelay(ms = 280) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiConfig.backendUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new AgentShieldApiError(
      message || "AgentShield backend request failed.",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
