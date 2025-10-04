// app/application/stream/StreamClient.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication, saveOrUpdateApplication } from "@/lib/applicationApi";

function Spinner({ size = 18 }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 00-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

  const options = [
    { key: "bachelors", label: "Bachelors", desc: "Undergraduate programs" },
    { key: "masters", label: "Masters", desc: "Postgraduate programs" },
    { key: "phd", label: "PhD", desc: "Doctoral programs" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar progress={progress} />
      <main className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-6">Select Stream</h1>

          <div className="flex flex-col gap-3">
            {options.map((opt) => {
              const isSelected = selectedStream === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelect(opt.key)}
                  disabled={loading}
                  className={`flex flex-col items-start text-left p-4 rounded-lg transition relative border
                    ${isSelected
                      ? "bg-blue-700 text-white border-blue-700 shadow-md"
                      : "bg-white border-gray-300 text-gray-800 hover:border-blue-600 hover:shadow"}
                    ${loading ? "opacity-70 cursor-not-allowed" : ""}
                  `}
                >
                  {loading && isSelected ? (
                    <span className="absolute right-4 top-4">
                      <Spinner size={18} />
                    </span>
                  ) : null}
                  <span className="text-base font-semibold">{opt.label}</span>
                  <span
                    className={`text-xs mt-1 ${
                      isSelected ? "text-gray-100" : "text-gray-500"
                    }`}
                  >
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}