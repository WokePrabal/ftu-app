// app/application/stream/StreamClient.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication, saveOrUpdateApplication } from "@/lib/applicationApi";


export default function StreamClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [selectedStream, setSelectedStream] = useState("");
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((app) => {
      if (!app) return;
      if (app.stream) setSelectedStream(app.stream);
      setProgress({
        selectStream: !!app.stream,
        program: !!app.program,
        personalDetails: !!app.fullname && !!app.email,
        upload: !!app.photoUrl && !!app.documentUrl,
        review: app.status === "Submitted",
      });
    });
  }, [id]);

  const handleSelect = async (stream) => {
    setLoading(true);
    try {
      await saveOrUpdateApplication(id, { stream }, router, "/application/program");
      setSelectedStream(stream);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Select Stream</h1>
        <div className="space-x-4">
          {["bachelors", "masters", "phd"].map((s) => (
            <button
              key={s}
              className={`px-4 py-2 rounded ${
                selectedStream === s ? "bg-blue-700 text-white" : "bg-blue-600 text-white"
              }`}
              onClick={() => handleSelect(s)}
              disabled={loading}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
