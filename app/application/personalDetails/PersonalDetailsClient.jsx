// app/application/personalDetails/PersonalDetailsClient.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication, saveOrUpdateApplication } from "@/lib/applicationApi";

export default function PersonalDetailsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((app) => {
      if (!app) return;
      if (app.fullname) setFullName(app.fullname);
      if (app.email) setEmail(app.email);
      setProgress({
        selectStream: !!app.stream,
        program: !!app.program,
        personalDetails: !!app.fullname && !!app.email,
        upload: !!app.photoUrl && !!app.documentUrl,
        review: app.status === "Submitted",
      });
    });
  }, [id]);

  const handleSave = async () => {
    if (!fullName || !email) {
      alert("Please fill both fields!");
      return;
    }
    setLoading(true);
    try {
      await saveOrUpdateApplication(
        id,
        { fullname: fullName, email },
        router,
        "/application/upload"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar progress={progress} />

      <main className="flex-1 p-6 flex justify-center items-start">
        {/* ✨ Compact card only as big as content */}
        <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-6">Personal Details</h1>

          {/* Full Name */}
          <div className="mb-5">
            <label className="block text-sm text-gray-600 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save & Continue →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}