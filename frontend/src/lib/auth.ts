// Auth helper utilities

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("business_profile");
}

export function getUser(): { id: number; email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("auth_user");
  return s ? JSON.parse(s) : null;
}

export function saveAuth(token: string, user: { id: number; email: string; name: string }) {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
}

// Helper to determine the API base URL
const getApiBase = () => {
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    }
    // For production, if NEXT_PUBLIC_API_URL is missing during build, 
    // we use a relative path. The user can then use Netlify's _redirects
    // to point /api-proxy/* to their backend URL.
    return process.env.NEXT_PUBLIC_API_URL || "/api-proxy";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

export const API_BASE = getApiBase();

if (typeof window !== "undefined") {
  console.log(`[StockSense AI] API Base configured as: ${API_BASE}`);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function apiRegister(email: string, password: string, name?: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function apiFetchTrends(sector: string, businessType: string, periods = 12) {
  const res = await fetch(
    `${API_BASE}/api/trends?sector=${encodeURIComponent(sector)}&business_type=${encodeURIComponent(businessType)}&periods=${periods}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
     const text = await res.text();
     if (text.trim().startsWith('<!DOCTYPE')) {
       throw new Error("Proxy error: Received HTML. Check _redirects.");
     }
     throw new Error("Failed to fetch trends");
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  throw new Error("Invalid response from server (expected JSON)");
}

export async function apiFetchProductAnalysis(sector: string, product: string, periods = 12, freq = "W") {
  const url = `${API_BASE}/api/product-analysis?sector=${encodeURIComponent(sector)}&product=${encodeURIComponent(product)}&periods=${periods}&freq=${freq}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  
  if (!res.ok) {
    const text = await res.text();
    // If we get HTML instead of JSON, it's likely a proxy/routing error
    if (text.trim().startsWith('<!DOCTYPE')) {
      throw new Error(`Server configuration error: Received HTML instead of data. Check your API URL in _redirects.`);
    }
    throw new Error("Failed to fetch product analysis");
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  } else {
    const text = await res.text();
    if (text.trim().startsWith('<!DOCTYPE')) {
      throw new Error("API configuration error: Your proxy is pointing to a page, not an API. Verify the URL in _redirects.");
    }
    throw new Error("Invalid response format from server");
  }
}

export async function apiUploadDataset(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function apiForgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to process request");
  }
  return res.json();
}

export async function apiResetPassword(token: string, new_password: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to reset password");
  }
  return res.json();
}
