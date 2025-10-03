// app/application/personalDetails/page.js
import React, { Suspense } from "react";
import PersonalDetailsClient from "./PersonalDetailsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading personal details...</div>}>
      <PersonalDetailsClient />
    </Suspense>
  );
}
