"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function PreviewClient() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [progress, setProgress] = useState({});

  async function fetchApplication(appId) {
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (!res.ok) return null;
      const j = await res.json();
      return j.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((data) => {
      setApp(data);
      setProgress({
        selectStream: !!data?.stream,
        program: !!data?.program,
        personalDetails: !!data?.fullname && !!data?.email,
        upload: !!data?.photoUrl && !!data?.documentUrl,
        review: data?.status === "Submitted",
      });
    });
  }, [id]);

  if (!app) return <p className="p-6">Loading...</p>;

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-4">Application Preview</h1>

        <div className="mb-6 space-y-2">
          <p><strong>Stream:</strong> {app.stream || <em>Not provided</em>}</p>
          <p><strong>Program:</strong> {app.program || <em>Not provided</em>}</p>
          <p><strong>Full name:</strong> {app.fullname || <em>Not provided</em>}</p>
          <p><strong>Email:</strong> {app.email || <em>Not provided</em>}</p>
          <div>
            <strong>Photo:</strong>{" "}
            {app.photoUrl ? (
              <img src={app.photoUrl} alt="photo" style={{ maxWidth: 200 }} />
            ) : (
              <em>Not provided</em>
            )}
          </div>
          <div>
            <strong>Document:</strong>{" "}
            {app.documentUrl ? (
              <a
                href={app.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View Document
              </a>
            ) : (
              <em>Not provided</em>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
