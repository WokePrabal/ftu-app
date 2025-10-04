// components/Sidebar.jsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Sidebar({ progress = {} }) {
  const searchParams = useSearchParams();
  const queryId = searchParams?.get?.("id");

  const withId = (path) => (queryId ? `${path}?id=${encodeURIComponent(queryId)}` : path);

  return (
    <div className="w-64 bg-gray-100 h-screen p-5">
      <h2 className="text-xl font-bold mb-6">Application Steps</h2>
      <ul className="space-y-3">
        <li>
          <Link href={withId("/application/stream")} className="flex items-center justify-between">
            <span>Select Stream</span>
            {progress.selectStream ? <span>✅</span> : null}
          </Link>
        </li>
        <li>
          <Link href={withId("/application/program")} className="flex items-center justify-between">
            <span>Program of Study</span>
            {progress.program ? <span>✅</span> : null}
          </Link>
        </li>
        <li>
          <Link href={withId("/application/personalDetails")} className="flex items-center justify-between">
            <span>Personal Details</span>
            {progress.personalDetails ? <span>✅</span> : null}
          </Link>
        </li>
        <li>
          <Link href={withId("/application/upload")} className="flex items-center justify-between">
            <span>Upload Documents</span>
            {progress.upload ? <span>✅</span> : null}
          </Link>
        </li>
        <li>
          <Link href={withId("/application/review")} className="flex items-center justify-between">
            <span>Review & Submit</span>
            {progress.review ? <span>✅</span> : null}
          </Link>
        </li>
      </ul>
    </div>
  );
}