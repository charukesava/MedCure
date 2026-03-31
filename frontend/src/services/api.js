// Falls back to localhost in development; set REACT_APP_API_URL in production
import { validateApiResponse } from "../utils/security";

export const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Returns { Authorization: "Bearer <idToken>" } for the current Firebase user.
 * Throws if the user is not signed in.
 */
export const getAuthHeaders = async (firebaseUser) => {
  if (!firebaseUser) throw new Error("Not authenticated");
  const token = await firebaseUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Generic GET helper with optional AbortSignal support.
 * Validates and sanitizes responses for security.
 */
export const getData = (url, signal) =>
  fetch(url, { signal }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      throw Object.assign(new Error("Request failed"), {
        status: res.status,
        data: json,
      });
    // 🔐 Validate API response for suspicious patterns
    validateApiResponse(json);
    return json;
  });

/**
 * Generic POST helper with optional AbortSignal support.
 * Validates and sanitizes responses for security.
 */
export const postData = (url, data, signal, headers = {}) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
    signal,
  }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error("Request failed"), {
        status: res.status,
        data: json,
      });
    }
    // 🔐 Validate API response for suspicious patterns
    validateApiResponse(json);
    return json;
  });

/**
 * POST /api/hospital-updates (requires admin auth)
 */
export const postHospitalUpdates = async (data, firebaseUser) => {
  const headers = await getAuthHeaders(firebaseUser);
  return postData(`${BASE_URL}/api/hospital-updates`, data, undefined, headers);
};

/**
 * GET /api/hospital-updates
 */
export const getHospitalUpdates = (signal) =>
  getData(`${BASE_URL}/api/hospital-updates`, signal);
