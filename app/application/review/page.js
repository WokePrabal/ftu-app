import React, { Suspense } from "react";
import ReviewClient from "./ReviewClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading review UI…</div>}>
      <ReviewClient />
    </Suspense>
  );
}
