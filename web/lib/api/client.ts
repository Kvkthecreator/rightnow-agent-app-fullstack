export class ApiClient {
  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, { cache: 'no-store', ...init });
    if (!res.ok) throw new Error(`[${init?.method ?? 'GET'}] ${path} → ${res.status}`);
    return res.json();
  }
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request(path, { ...init, method: 'GET' });
  }
  async post<T>(path: string, data?: any, init?: RequestInit): Promise<T> {
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      body: data ? JSON.stringify(data) : undefined,
      ...init,
    });
  }
}
export const api = new ApiClient();
export const apiClient = api;
