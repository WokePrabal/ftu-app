"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";


export default function Page() {
  const { id } = useParams();
  const router = useRouter();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchApp() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        const json = await res.json();
        setApp(json.data);
      } catch (err) {
        console.error("Error fetching app:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchApp();
  }, [id]);

  const handleSubmit = async () => {
    if (!app) return;

    if (app.status === "Submitted") {
      alert("Application already submitted");
      return;
    }

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Submitted" }),
      });

      if (res.ok) {
        const json = await res.json();
        setApp(json.data);
        alert("Application submitted successfully");
      } else {
        // try to read error body if present
        let message = "Failed to submit";
        try {
          const errJson = await res.json();
          if (errJson?.error) message = errJson.error;
        } catch {}
        alert(message);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting application");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!app) return <div className="p-6">Application not found</div>;

  return (
    <>
      
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">{app.fullname || "No name"}</h1>
        <div className="mb-4">
          <span
            className={
              "px-2 py-1 rounded " +
              (app.status === "Submitted"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800")
            }
          >
            {app.status}
          </span>
        </div>

        <div className="border rounded p-4 mb-4">
          <p>
            <strong>Email:</strong> {app.email}
          </p>
          <p>
            <strong>Program:</strong> {app.program}
          </p>
          <p>
            <strong>Stream:</strong> {app.stream}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Submit
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Back
          </button>
        </div>
      </main>
    </>
  );
}