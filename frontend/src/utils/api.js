export const API_BASE = (
  process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:8080")
).replace(/\/$/, "");
export const isLoggedIn = () => Boolean(localStorage.getItem("token"));
export async function api(
  path,
  method = "GET",
  body = null,
  auth = true,
  signal,
) {
  const headers = {};
  const token = localStorage.getItem("token");
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const form = body instanceof FormData;
  if (body && !form) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    signal,
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 401 && auth && token) {
    // Stop sending a rejected session token on subsequent requests.
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    if (window.location.pathname !== "/login") {
      window.location.replace("/login?session=expired");
    }
    throw new Error("Please log in again to continue.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || `Request failed (${res.status}). Please try again.`,
    );
  return data;
}
export function eventDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
export function eventTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
