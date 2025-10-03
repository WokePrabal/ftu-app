"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axiosConfig"; // agar axiosConfig kahin aur hai toh path adjust karna

export default function useEnrollment({ fetchOnInit = false } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomingAppId = typeof window !== "undefined" ? searchParams?.get?.("appId") ?? null : null;

  const [appId, setAppIdState] = useState(incomingAppId ?? null);
  const [loading, setLoading] = useState(false);

  // Sync URL -> state when search params change
  useEffect(() => {
    if (incomingAppId && incomingAppId !== appId) {
      setAppIdState(incomingAppId);
      if (fetchOnInit) fetchEnrollment(incomingAppId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingAppId]);

  const setAppId = useCallback((id) => {
    setAppIdState(id);
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("appId", id);
      else url.searchParams.delete("appId");
      router.replace(url.pathname + url.search);
    } catch (e) {}
  }, [router]);

  const fetchEnrollment = useCallback(async (id) => {
    if (!id) return null;
    try {
      setLoading(true);
      const res = await api.get(`/api/enrollment?appId=${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      console.error("fetchEnrollment err", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createEnrollmentIfNeeded = useCallback(async (initialPayload = {}) => {
    if (appId) return appId;
    try {
      setLoading(true);
      const res = await api.post("/api/enrollment", { step: "initial", data: initialPayload });
      const newAppId = res?.data?.appId ?? res?.data?.id ?? null;
      if (!newAppId) throw new Error("No appId returned from backend");
      setAppId(newAppId);
      try { localStorage.setItem("ftu_appId", newAppId); } catch (e) {}
      return newAppId;
    } catch (err) {
      console.error("createEnrollmentIfNeeded err", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, setAppId]);

  const saveStep = useCallback(async (stepName, stepData) => {
    try {
      setLoading(true);
      const id = await createEnrollmentIfNeeded({});
      const payload = { step: stepName, data: stepData, appId: id };
      const res = await api.post("/api/enrollment", payload);
      return res.data;
    } catch (err) {
      console.error("saveStep err", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createEnrollmentIfNeeded]);

  const goToStep = useCallback((path) => {
    try {
      const url = new URL(window.location.href);
      if (appId) url.searchParams.set("appId", appId);
      router.push(path + url.search);
    } catch (e) {
      router.push(path);
    }
  }, [appId, router]);

  return {
    appId,
    setAppId,
    loading,
    createEnrollmentIfNeeded,
    saveStep,
    fetchEnrollment,
    goToStep,
  };
}
