"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication } from "@/lib/applicationApi";
import jsPDF from "jspdf";

export default function ReviewClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  const [app, setApp] = useState(undefined);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchedForIdRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    if (fetchedForIdRef.current === id) return;
    fetchedForIdRef.current = id;

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchApplication(id);
        if (!mounted) return;

        const appData =
          data?.application ??
          data?.data ??
          (Array.isArray(data) ? data[0] : data) ??
          null;

        setApp(appData);
        const fullname = appData.fullname ?? "";
        const email = appData.email ?? "";
        const photo = appData.photoUrl;
        const doc = appData.documentUrl;
        const status = (appData.status ?? "").toString();

        setProgress({
          selectStream: !!appData.stream,
          program: !!appData.program,
          personalDetails: !!fullname && !!email,
          upload: !!photo && !!doc,
          review: status.toLowerCase() === "submitted",
        });
      } catch (err) {
        setError("Fetch failed");
        setApp(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <p className="p-6">Loading application…</p>;
  if (app === null) return <p>No Application Found</p>;
  if (!app) return null;

  const fullname = app.fullname ?? "";
  const email = app.email ?? "";
  const photoUrl = app.photoUrl;
  const documentUrl = app.documentUrl;
  const status = app.status ?? "";

  const requiredMissing = [];
  if (!app.stream) requiredMissing.push("Stream");
  if (!app.program) requiredMissing.push("Program");
  if (!fullname) requiredMissing.push("Full name");
  if (!email) requiredMissing.push("Email");
  if (!photoUrl) requiredMissing.push("Profile photo");
  if (!documentUrl) requiredMissing.push("Supporting document");

  const canSubmit =
    requiredMissing.length === 0 && status.toLowerCase() !== "submitted";

  // helper: convert image url -> base64
  const getBase64Image = (url) =>
    new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
      } catch (err) {
        reject(err);
      }
    });

  const generatePDF = async () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Your application is submitted in FTU", 20, 20);

    doc.setFontSize(12);
    doc.text(`Full Name: ${fullname}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 50);
    doc.text(`Stream: ${app.stream}`, 20, 60);
    doc.text(`Program: ${app.program}`, 20, 70);

    // add photo thumbnail
    if (photoUrl) {
      try {
        const base64Photo = await getBase64Image(photoUrl);
        doc.addImage(base64Photo, "PNG", 20, 90, 40, 40);
        doc.text("Profile Photo", 20, 135);
      } catch (e) {
        console.error("Photo load failed:", e);
      }
    }

    // add document thumbnail
    if (documentUrl) {
      try {
        const base64Doc = await getBase64Image(documentUrl);
        doc.addImage(base64Doc, "PNG", 80, 90, 60, 60);
        doc.text("Supporting Document", 80, 155);
      } catch (e) {
        console.error("Doc load failed, fallback to link:", e);
        doc.text("Supporting Document:", 20, 150);
        doc.setTextColor(0, 0, 255);
        doc.textWithLink("Open Document", 20, 160, { url: documentUrl });
        doc.setTextColor(0, 0, 0);
      }
    }

    doc.save("FTU-Application.pdf");
  };

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
        await generatePDF();
        router.replace("/");
      } else {
        setError(j?.error || j?.message || "Submit failed");
      }
    } catch (err) {
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
            <strong>Stream:</strong> {app.stream}
          </p>
          <p>
            <strong>Program:</strong> {app.program}
          </p>
          <p>
            <strong>Full name:</strong> {fullname}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>

          <div>
            <strong>Photo:</strong>{" "}
            {photoUrl ? (
              <img src={photoUrl} alt="photo" style={{ maxWidth: 200 }} />
            ) : (
              <em>Not provided</em>
            )}
          </div>

          <div>
            <strong>Document:</strong>{" "}
            {documentUrl ? (
              <img
                src={documentUrl}
                alt="document"
                style={{ maxWidth: 200 }}
              />
            ) : (
              <em>Not provided</em>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className={`px-6 py-2 rounded ${
            canSubmit
              ? "bg-green-600 text-white"
              : "bg-gray-300 text-gray-700 cursor-not-allowed"
          }`}
        >
          {loading
            ? "Submitting..."
            : status.toLowerCase() === "submitted"
            ? "Already Submitted"
            : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
