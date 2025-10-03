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
      await saveOrUpdateApplication(id, { fullname: fullName, email }, router, "/application/upload");
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-4">Personal Details</h1>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}
