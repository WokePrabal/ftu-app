"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication } from "@/lib/applicationApi";
import { API_BASE_URL } from "@/lib/config";
import jsPDF from "jspdf";

export default function ReviewClientWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  const [app, setApp] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedForIdRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setApp(null);
      setProgress({});
      setError("No application selected. Please open the application via a link with ?id=<id>.");
      return;
    }
    if (fetchedForIdRef.current === id) return;
    fetchedForIdRef.current = id;

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApplication(id);
        if (!mounted) return;
        const appData = data?.application ?? data?.data ?? (Array.isArray(data) ? data[0] : data) ?? null;

        if (!appData) {
          setApp(null);
          setError("Application not found");
        } else {
          setApp(appData);
          const fullname = appData.fullname ?? "";
          const email = appData.email ?? "";
          const photoUrl = appData.photoUrl ?? appData.photo?.url ?? appData.photo?.secure_url ?? null;
          const docUrl = appData.documentUrl ?? null;
          const docsArr = Array.isArray(appData.documents) ? appData.documents : (docUrl ? [{ url: docUrl, filename: appData.documentName || undefined }] : []);
          const status = (appData.status ?? "").toString();

          setProgress({
            selectStream: !!appData.stream,
            program: !!appData.program,
            personalDetails: !!fullname && !!email,
            upload: !!photoUrl && !!(docsArr.length),
            review: status.toLowerCase() === "submitted",
          });
        }
      } catch (err) {
        console.error("Review fetch error:", err);
        setError("Fetch failed");
        setApp(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (!id) return (
    <div className="p-6">
      <p className="text-red-600 mb-4">
        No application selected. Make sure the URL has <code>?id=&lt;applicationId&gt;</code>.
      </p>
      <p>
        <a href="/application/stream" className="text-blue-600 underline">
          Start a new application
        </a>
      </p>
    </div>
  );

  if (loading) return <p className="p-6">Loading application…</p>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (app === null) return <div className="p-6">Application not found</div>;

  // normalize values
  const fullname = app.fullname ?? "";
  const email = app.email ?? "";
  const photoUrl = app.photoUrl ?? app.photo?.url ?? app.photo?.secure_url ?? null;
  const documents = Array.isArray(app.documents)
    ? app.documents
    : app.documentUrl
    ? [{ url: app.documentUrl, filename: app.documentName ?? undefined }]
    : [];

  const status = (app.status ?? "").toString();

  // find pending fields
  const requiredMissing = [];
  if (!app.stream) requiredMissing.push("Stream");
  if (!app.program) requiredMissing.push("Program");
  if (!fullname) requiredMissing.push("Full Name");
  if (!email) requiredMissing.push("Email");
  if (!photoUrl) requiredMissing.push("Profile Photo");
  if (!documents.length) requiredMissing.push("Supporting Document");

  const canSubmit = requiredMissing.length === 0 && status.toLowerCase() !== "submitted";

  // map pending field -> route for editing
  const editRouteForField = (field) => {
    switch (field) {
      case "Stream":
        return `/application/stream?id=${encodeURIComponent(id)}`;
      case "Program":
        return `/application/program?id=${encodeURIComponent(id)}`;
      case "Full Name":
      case "Email":
        return `/application/personal?id=${encodeURIComponent(id)}`; // adjust if your route is different
      case "Profile Photo":
      case "Supporting Document":
        return `/application/upload?id=${encodeURIComponent(id)}`;
      default:
        return `/application/review?id=${encodeURIComponent(id)}`;
    }
  };

  // filename helper
  const filenameFrom = (d) => {
    if (!d) return "file";
    if (d.filename) return d.filename;
    if (d.url) {
      try {
        const u = new URL(d.url);
        return u.pathname.split("/").pop() || d.url;
      } catch (e) {
        return d.url;
      }
    }
    return "file";
  };

  // Create PDF with table layout and clickable "View uploaded file" links.
  // We will render a simple table manually (header + rows) and add link rectangles where needed.
  const generatePdfBlobWithLinks = () => {
    const doc = new jsPDF({ unit: "pt" });
    const margin = 40;
    let y = 60;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const col1W = 160;
    const col2W = pageWidth - margin * 2 - col1W;
    const rowH = 22;
    const lineGap = 6;

    // Title
    doc.setFontSize(20);
    doc.text("FTU Admission", margin, y);
    y += 30;

    doc.setFontSize(12);

    // draw header line
    doc.setFillColor(240,240,240);
    doc.rect(margin, y, col1W + col2W, rowH, "F");
    doc.setTextColor(30,30,30);
    doc.setFont(undefined, "bold");
    doc.text("Field", margin + 8, y + 15);
    doc.text("Value", margin + col1W + 8, y + 15);
    doc.setFont(undefined, "normal");
    y += rowH;

    const addRow = (field, valueText, linkUrl = null) => {
      // border
      doc.rect(margin, y, col1W + col2W, rowH);
      // field cell
      doc.text(String(field), margin + 8, y + 15);
      // value cell (wrap if too long)
      const wrapped = doc.splitTextToSize(String(valueText), col2W - 12);
      doc.text(wrapped, margin + col1W + 8, y + 15);
      // if there's a link, add an invisible link rectangle covering the value text
      if (linkUrl) {
        // compute height of wrapped lines
        const h = wrapped.length * (rowH / 1.4); // approximate
        doc.link(margin + col1W + 8, y + 4, col2W - 12, h, { url: linkUrl });
      }
      y += Math.max(rowH, (wrapped.length * (rowH / 1.4)));
      // new page if needed
      if (y > pageHeight - margin - 60) {
        doc.addPage();
        y = margin;
      }
    };

    addRow("Applicant Name", fullname || "N/A");
    addRow("Email", email || "N/A");
    addRow("Stream", app.stream || "N/A");
    addRow("Program", app.program || "N/A");
    addRow("Status", status || "N/A");

    // Photo row: value is "View uploaded file" with link
    if (photoUrl) {
      addRow("Profile Photo", "View uploaded file", photoUrl);
    } else {
      addRow("Profile Photo", "Not provided");
    }

    // Documents: for each doc add a separate row with link text
    if (documents.length) {
      documents.forEach((d, idx) => {
        const label = filenameFrom(d);
        addRow(`Document ${idx + 1}`, "View uploaded file", d.url);
      });
    } else {
      addRow("Documents", "None");
    }

    // Footer timestamp
    const now = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated: ${now}`, margin, pageHeight - 30);

    return doc.output("blob");
  };

  // Submit handler: generate & download PDF then mark submitted
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      // generate and download
      const pdfBlob = generatePdfBlobWithLinks();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `application_${app._id ?? app.id ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // call server to mark submitted
      const res = await fetch(`${API_BASE_URL}/api/applications/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Submitted" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || j?.message || "Submit failed");

      router.replace("/");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar progress={progress} />
      <main className="flex-1 p-6 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Review & Submit</h1>

          {/* Pending (only) */}
          {requiredMissing.length > 0 ? (
            <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-700 rounded">
              <strong>Pending Fields:</strong>
              <ul className="mt-2 space-y-2">
                {requiredMissing.map((field) => (
                  <li key={field}>
                    <button
                      onClick={() => router.push(editRouteForField(field))}
                      className="text-left w-full text-sm p-2 rounded hover:bg-red-100"
                    >
                      <span className="font-medium">{field}</span>
                      <span className="ml-2 text-xs text-red-700"> — Click to edit</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null }

          {/* Summary card */}
          <div className="space-y-6">
            {/* Program */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-semibold text-lg mb-2">Program Details</h2>
              <p><strong>Stream:</strong> {app.stream || <span className="text-red-600">Not Provided</span>}</p>
              <p><strong>Program:</strong> {app.program || <span className="text-red-600">Not Provided</span>}</p>
            </div>

            {/* Personal */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-semibold text-lg mb-2">Personal Details</h2>
              <p><strong>Full Name:</strong> {fullname || <span className="text-red-600">Not Provided</span>}</p>
              <p><strong>Email:</strong> {email || <span className="text-red-600">Not Provided</span>}</p>
            </div>

            {/* Uploads (thumbnails + filenames, no individual download/view buttons) */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-semibold text-lg mb-2">Uploads</h2>
              <div className="flex gap-6">
                <div>
                  <strong>Photo:</strong>
                  {photoUrl ? (
                    <div className="mt-2">
                      <img src={photoUrl} alt="photo" className="w-24 h-24 object-cover rounded shadow" />
                      <div className="mt-2 text-sm text-gray-700">{filenameFrom({ url: photoUrl })}</div>
                    </div>
                  ) : (
                    <p className="text-red-600 mt-2">Not Provided</p>
                  )}
                </div>

                <div className="flex-1">
                  <strong>Document(s):</strong>
                  <div className="mt-2 space-y-2">
                    {documents.length ? (
                      documents.map((d, idx) => (
                        <div key={d.public_id ?? d.url ?? idx} className="flex items-center justify-between gap-4 p-2 border rounded">
                          <div className="flex items-center gap-3">
                            {(d.resource_type?.startsWith?.("image") || /\.(jpg|jpeg|png)$/i.test(d.url || "")) ? (
                              <img src={d.url} alt={filenameFrom(d)} className="w-16 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-12 flex items-center justify-center text-xs bg-gray-100 rounded">
                                {filenameFrom(d).split(".").pop() || "DOC"}
                              </div>
                            )}

                            <div className="text-sm">
                              <div className="font-medium">{filenameFrom(d)}</div>
                              <div className="text-xs text-gray-500">{d.resource_type ?? ""}</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500">Included in PDF</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">No documents uploaded</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="mt-6 text-red-600">Error: {error}</div>}

          {/* Submit button */}
          <div className="mt-8 flex justify-end items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className={`px-6 py-2 rounded-lg shadow transition ${
                canSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              {loading ? "Submitting..." : status.toLowerCase() === "submitted" ? "Already Submitted" : "Submit Application"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}