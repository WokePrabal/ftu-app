// app/application/upload/UploadClient.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication, saveOrUpdateApplication } from "@/lib/applicationApi";

export default function UploadClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [photoFile, setPhotoFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((app) => {
      if (!app) return;
      setProgress({
        selectStream: !!app.stream,
        program: !!app.program,
        personalDetails: !!app.fullname && !!app.email,
        upload: !!app.photoUrl && !!app.documentUrl,
        review: app.status === "Submitted",
      });
    });
  }, [id]);

  const toBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = (err) => rej(err);
      reader.readAsDataURL(file);
    });

  const handleNext = async () => {
    if (!photoFile || !docFile) {
      alert("Upload both photo and document!");
      return;
    }
    setLoading(true);
    try {
      const photoBase64 = await toBase64(photoFile);
      const docBase64 = await toBase64(docFile);
      await saveOrUpdateApplication(id, { photoUrl: photoBase64, documentUrl: docBase64 }, router, "/application/review");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-4">Upload Documents</h1>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Profile Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-medium">Supporting Document</label>
          <input type="file" onChange={(e) => setDocFile(e.target.files[0])} />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleNext} disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
