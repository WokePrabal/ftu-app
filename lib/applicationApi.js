// lib/applicationApi.js

/**
 * Fetch application by id
 */
export async function fetchApplication(id) {
  try {
    const res = await fetch(`/api/applications/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    return j.data;
  } catch (e) {
    console.error("fetchApplication error:", e);
    return null;
  }
}

/**
 * Create or update application
 * - If id present → update
 * - Else → create new
 */
export async function saveOrUpdateApplication(id, partial, router, redirectTo) {
  try {
    if (id) {
      // 🔹 Update existing
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");

      // ensure consistent navigation with ?id
      if (redirectTo) router.push(`${redirectTo}?id=${encodeURIComponent(id)}`);

      // save in localStorage for fallback
      if (id) localStorage.setItem("currentAppId", id);

      return j.data;
    } else {
      // 🔹 Create new
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Create failed");

      // backend must return new id (adjust key if different)
      const newId = j?.data?._id ?? j?.data?.id ?? j?.id;
      if (!newId) throw new Error("Create succeeded but no id returned");

      // save in localStorage for fallback
      localStorage.setItem("currentAppId", newId);

      // always navigate with id in URL
      if (redirectTo) {
        router.replace(`${redirectTo}?id=${encodeURIComponent(newId)}`);
      }

      return j.data;
    }
  } catch (err) {
    console.error("saveOrUpdateApplication error:", err);
    throw err;
  }
}
