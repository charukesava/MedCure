// Falls back to localhost in development; set REACT_APP_API_URL in production
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
 */
export const getData = (url, signal) =>
  fetch(url, { signal }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok)
      throw Object.assign(new Error("Request failed"), {
        status: res.status,
        data: json,
      });
    return json;
  });

/**
 * Generic POST helper with optional AbortSignal support.
 */
export const postData = (url, data, signal) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    return json;
  });

/**
 * POST /api/hospital-updates
 */
export const postHospitalUpdates = (data) =>
  postData(`${BASE_URL}/api/hospital-updates`, data);

/**
 * GET /api/hospital-updates
 */
export const getHospitalUpdates = (signal) =>
  getData(`${BASE_URL}/api/hospital-updates`, signal);
