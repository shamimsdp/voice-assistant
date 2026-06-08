const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    const token = this.getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(body !== undefined ? { "Content-Type": "application/json" } : {}),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
      throw new Error(error.detail || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async get<T = any>(path: string): Promise<T> {
    return this.request("GET", path);
  }

  async post<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request("POST", path, body);
  }

  async put<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request("PUT", path, body);
  }

  async patch<T = any>(path: string, body?: unknown): Promise<T> {
    return this.request("PATCH", path, body);
  }

  async delete<T = any>(path: string): Promise<T> {
    return this.request("DELETE", path);
  }
}

export const api = new ApiClient(API_BASE);
