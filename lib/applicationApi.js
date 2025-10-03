// lib/applicationApi.js
import { API_BASE_URL } from "./config";

/**
 * Fetch application by id
 */
export async function fetchApplication(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/applications/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.data;
  } catch (e) {
    console.error("fetchApplication error:", e);
    return null;
  }
}

/**
 * Save or update application and ensure navigation includes ?id=...
 */
export async function saveOrUpdateApplication(id, partial, router, redirectTo) {
  const safeNavigate = (path, replace = true) => {
    if (!router || !path) return;
    try {
      if (replace && typeof router.replace === "function") {
        router.replace(path);
      } else if (typeof router.push === "function") {
        router.push(path);
      }
    } catch (e) {
      console.warn("router navigation failed:", e);
    }
  };

  try {
    if (id) {
      // UPDATE
      const res = await fetch(`${API_BASE_URL}/api/applications/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");

      if (redirectTo) safeNavigate(`${redirectTo}?id=${encodeURIComponent(id)}`, true);

      return { data: j.data, id };
    } else {
      // CREATE
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");

      const newId = j?.data?._id ?? j?.data?.id ?? j?.id;
      if (!newId) throw new Error("Create succeeded but no id returned");

      if (redirectTo) safeNavigate(`${redirectTo}?id=${encodeURIComponent(newId)}`, true);

      return { data: j.data, id: newId };
    }
  } catch (err) {
    console.error("saveOrUpdateApplication error:", err);
    throw err;
  }
}