"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication } from "@/lib/applicationApi";

export default function UploadClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [photoFile, setPhotoFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [docError, setDocError] = useState("");
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((app) => {
      if (!app) return;
      setProgress({
        selectStream: !!app.stream,
        program: !!app.program,
        personalDetails: !!app.fullname && !!app.email,
        upload: !!app.photo?.url && !!(app.documents && app.documents.length),
        review: app.status === "Submitted",
      });
    });
  }, [id]);

  const handleFileChange = (e, setter, setError, accepts = []) => {
    const file = e.target.files[0];
    if (!file) {
      setter(null);
      setError("");
      return;
    }

    if (accepts.length && !accepts.includes(file.type)) {
      setError("Invalid file type");
      e.target.value = "";
      setter(null);
      return;
    }

    setError("");
    setter(file);
  };

  const handleNext = async () => {
    if (!photoFile || !docFile) {
      if (!photoFile) setPhotoError("Please upload a profile photo.");
      if (!docFile) setDocError("Please upload a supporting document.");
      return;
    }

    setLoading(true);
    setUploadPercent(0);

    try {
      const formData = new FormData();
      // include existing id if editing; server will create if missing
      if (id) formData.append("appId", id);
      formData.append("photo", photoFile);
      formData.append("documents", docFile);

      // Use XHR to get upload progress and get returned app id
      const returnedAppId = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadPercent(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res && res.success) {
                const appIdFromServer = res.application?._id || res.application?.id || id;
                resolve(appIdFromServer);
              } else {
                reject(new Error(res?.error || "Upload failed"));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      if (!returnedAppId) {
        alert("Upload succeeded but server didn't return application id. Check server logs.");
      } else {
        // Navigate to review with the returned app id (important fix)
        router.push(`/application/review?id=${returnedAppId}`);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
      setUploadPercent(0);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar progress={progress} />

      <main className="flex-1 p-6 flex justify-center items-start">
        <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-6">Upload Documents</h1>

          {/* Profile Photo */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleFileChange(e, setPhotoFile, setPhotoError, [
                  "image/png",
                  "image/jpeg",
                  "image/jpg",
                ])
              }
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0 file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {photoError && <p className="text-red-600 text-sm mt-1">{photoError}</p>}
            {photoFile && (
              <img
                src={URL.createObjectURL(photoFile)}
                alt="Preview"
                className="mt-3 w-24 h-24 rounded-full object-cover shadow"
              />
            )}
          </div>

          {/* Supporting Document */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Supporting Document (PDF/DOC/DOCX or image)
            </label>
            <input
              type="file"
              accept=".pdf, .doc, .docx, image/*"
              onChange={(e) =>
                handleFileChange(
                  e,
                  setDocFile,
                  setDocError,
                  []
                )
              }
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0 file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {docError && <p className="text-red-600 text-sm mt-1">{docError}</p>}
            {docFile && docFile.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(docFile)}
                alt="Preview"
                className="mt-3 w-32 rounded border"
              />
            )}
            {docFile && !docFile.type.startsWith("image/") && (
              <p className="mt-3 text-sm text-gray-600">{docFile.name} ({Math.round(docFile.size/1024)} KB)</p>
            )}
          </div>

          {/* Upload progress */}
          {loading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                <div
                  style={{ width: `${uploadPercent}%` }}
                  className="h-3 rounded bg-[#a80534] transition-all"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{uploadPercent}%</p>
            </div>
          )}

          {/* Action */}
          <div className="flex justify-end">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? `Uploading ${uploadPercent}%` : "Save & Continue →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}