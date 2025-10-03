// lib/navigation.js
export function navigateWithId(router, path, id) {
  const useId = id ?? (typeof window !== "undefined" ? localStorage.getItem("currentAppId") : null);
  if (useId) {
    router.push(`${path}?id=${encodeURIComponent(useId)}`);
  } else {
    router.push(path);
  }
}
