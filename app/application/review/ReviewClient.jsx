// components/ReviewClientWrapper.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication } from "@/lib/applicationApi";

export default function ReviewClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id"); // may be undefined initially

  const [app, setApp] = useState(undefined); // undefined = not yet fetched, null = not found
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitingForId, setWaitingForId] = useState(false);

  const fetchedForIdRef = useRef(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    // If searchParams not ready (server -> client transition), do nothing yet
    if (typeof id === "undefined") return;

    // If no id in URL, try localStorage fallback immediately
    if (!id) {
      const fallback = typeof window !== "undefined" ? localStorage.getItem("currentAppId") : null;
      if (fallback) {
        console.log("[Review] Found fallback id in localStorage:", fallback);
        // Replace URL so searchParams picks it up (causes this effect to re-run with new id)
        router.replace(`/application/review?id=${encodeURIComponent(fallback)}`);

        return;
      }

      // If no fallback, show a small waiting window before redirecting user back to start
      setWaitingForId(true);
      const timer = setTimeout(() => {
        // Re-check before redirecting, maybe id arrived
        const currentId = new URLSearchParams(window.location.search).get("id");
        if (!currentId && !redirectedRef.current) {
          redirectedRef.current = true;
          console.warn("[Review] No id found — redirecting to stream start");
          router.replace("/application/stream");
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
        setWaitingForId(false);
      };
    }

    // If we already fetched for this id, skip
    if (fetchedForIdRef.current === id) return;
    fetchedForIdRef.current = id;

    // Fetch application for this id
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[Review] fetching application for id:", id);
        const data = await fetchApplication(id);
        if (!mounted) return;

        const appData = data?.application ?? data?.data ?? (Array.isArray(data) ? data[0] : data) ?? null;

        if (!appData) {
          setApp(null);
          setError("Application not found");
          return;
        }

        setApp(appData);

        const fullname = appData.fullname ?? appData.fullName ?? "";
        const email = appData.email ?? appData.emailAddress ?? "";
        const photo = appData.photoUrl ?? appData.photo ?? appData.profilePhoto;
        const doc = appData.documentUrl ?? appData.document ?? appData.supportingDocument;
        const status = (appData.status ?? "").toString();

        setProgress({
          selectStream: !!(appData.stream || appData.selectedStream),
          program: !!appData.program,
          personalDetails: !!fullname && !!email,
          upload: !!photo && !!doc,
          review: status.toLowerCase() === "submitted",
        });

        // keep localStorage in sync (helpful if other flows forgot to persist)
        try {
          localStorage.setItem("currentAppId", id);
        } catch (e) {
          // ignore localStorage errors
        }
      } catch (err) {
        console.error("Review: fetch error", err);
        setError(err?.message ?? "Fetch failed");
        setApp(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, router, searchParams, router.pathname]);

  // UI states
  if (waitingForId) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Preparing review…</h2>
        <p className="text-sm text-gray-600 mt-2">
          Waiting for application ID to appear — this usually happens immediately after saving. If nothing appears in a few
          seconds, you'll be redirected to start.
        </p>
      </div>
    );
  }

  if (loading) return <p className="p-6">Loading application…</p>;
  if (app === undefined) return <p className="p-6">Preparing…</p>;

  if (app === null) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">No application found</h2>
        {error && <p className="text-red-600">Error: {error}</p>}
        <p>Please check the application link or start a new application.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/application/stream")}
        >
          Start New Application
        </button>
      </div>
    );
  }

  // Render review UI
  const fullname = app.fullname ?? app.fullName ?? "";
  const email = app.email ?? app.emailAddress ?? "";
  const photoUrl = app.photoUrl ?? app.profilePhoto ?? app.photo;
  const documentUrl = app.documentUrl ?? app.document ?? app.supportingDocument;
  const status = app.status ?? "";

  const requiredMissing = [];
  if (!app.stream && !app.selectedStream) requiredMissing.push("Stream");
  if (!app.program) requiredMissing.push("Program");
  if (!fullname) requiredMissing.push("Full name");
  if (!email) requiredMissing.push("Email");
  if (!photoUrl) requiredMissing.push("Profile photo");
  if (!documentUrl) requiredMissing.push("Supporting document");

  const canSubmit = requiredMissing.length === 0 && status.toLowerCase() !== "submitted";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Submitted" }),
      });
      const j = await res.json();
      if (res.ok) {
        router.replace("/"); // go home after submit
      } else {
        setError(j?.error || j?.message || "Submit failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-4">Review & Submit</h1>

        <div className="mb-6 space-y-2">
          <p>
            <strong>Stream:</strong> {app.stream || app.selectedStream || <em>Not provided</em>}
          </p>
          <p>
            <strong>Program:</strong> {app.program || <em>Not provided</em>}
          </p>
          <p>
            <strong>Full name:</strong> {fullname || <em>Not provided</em>}
          </p>
          <p>
            <strong>Email:</strong> {email || <em>Not provided</em>}
          </p>

          <div>
            <strong>Photo:</strong>{" "}
            {photoUrl ? <img src={photoUrl} alt="photo" style={{ maxWidth: 200 }} /> : <em>Not provided</em>}
          </div>

          <div>
            <strong>Document:</strong>{" "}
            {documentUrl ? (
              <a
                href={`/application/preview/${app._id ?? app.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Open
              </a>
            ) : (
              <em>Not provided</em>
            )}
          </div>
        </div>

        {requiredMissing.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 border rounded">
            <strong>Pending fields:</strong>
            <ul className="list-disc list-inside">
              {requiredMissing.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-gray-700">Please go back and complete the missing fields before submitting.</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className={`px-6 py-2 rounded ${canSubmit ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700 cursor-not-allowed"}`}
        >
          {loading ? "Submitting..." : status.toLowerCase() === "submitted" ? "Already Submitted" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
