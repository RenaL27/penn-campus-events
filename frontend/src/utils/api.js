// src/utils/api.js
const BASE_URL = "http://localhost:8080";

export async function api(path, method = "GET", body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  return res.json();
}
