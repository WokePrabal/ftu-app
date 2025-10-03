// app/application/stream/page.js  (server component — NO "use client")
import React, { Suspense } from "react";
import StreamClient from "./StreamClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading stream UI...</div>}>
      <StreamClient />
    </Suspense>
  );
}
