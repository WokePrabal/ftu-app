// app/application/program/page.js  (server component — NO "use client")
import React, { Suspense } from "react";
import ProgramClient from "./ProgramClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading program selection...</div>}>
      <ProgramClient />
    </Suspense>
  );
}
