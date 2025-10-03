// app/application/preview/[id]/page.js
import React, { Suspense } from "react";
import PreviewClient from "./PreviewClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <PreviewClient />
    </Suspense>
  );
}
