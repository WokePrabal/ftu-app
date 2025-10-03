// app/application/upload/page.js  (server component — NO "use client")
import React, { Suspense } from "react";
import UploadClient from "./UploadClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading upload UI...</div>}>
      <UploadClient />
    </Suspense>
  );
}
