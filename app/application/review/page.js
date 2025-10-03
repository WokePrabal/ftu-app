import React, { Suspense } from "react";
import ReviewClientWrapper from "./ReviewClientWrapper";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading review UI…</div>}>
      <ReviewClientWrapper />
    </Suspense>
  );
}