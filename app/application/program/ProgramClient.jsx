"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { fetchApplication, saveOrUpdateApplication } from "@/lib/applicationApi";

const OPTIONS = {
  bachelors: [
    "Bachelor of Science in Computer Science (BSCS)",
    "Bachelor of Science in Business Administration (BSBA)",
  ],
  masters: [
    "Master of Science in Computer Science (MSCS)",
    "Master of Business Administration (MBA)",
  ],
  phd: [
    "Doctorate in Computer Science",
    "Doctorate in Business Administration",
  ],
};

const STREAM_LABEL = {
  bachelors: "Bachelor’s",
  masters: "Master’s",
  phd: "PhD",
};

export default function ProgramClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [programs, setPrograms] = useState([]);
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [baseProgress, setBaseProgress] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id).then((app) => {
      if (!app) return;

      const streamVal = app.stream || "";
      setSelectedStream(streamVal);
      setPrograms(OPTIONS[streamVal] || []);

      // prefill program if saved
      if (app.program) setSelectedProgram(app.program);

      // save rest of progress states (not tied to program)
      setBaseProgress({
        personalDetails: !!app.fullname && !!app.email,
        upload: !!app.photoUrl && !!app.documentUrl,
        review: app.status === "Submitted",
      });
    });
  }, [id]);

  const handleNext = async () => {
    if (!selectedProgram) {
      alert("Select a program first!");
      return;
    }
    setLoading(true);
    try {
      await saveOrUpdateApplication(
        id,
        { stream: selectedStream, program: selectedProgram },
        router,
        "/application/personalDetails"
      );
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Always recalc progress live from current selections
  const progress = {
    ...baseProgress,
    selectStream: !!selectedStream,
    program: !!selectedProgram,
  };

  return (
    <div className="flex">
      <Sidebar progress={progress} />
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold mb-4">Program of Study</h1>

        {/* Show stream as label if already chosen */}
        {selectedStream ? (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">Selected stream</label>
            <div className="p-2 border rounded bg-gray-50">
              {STREAM_LABEL[selectedStream] || selectedStream}
            </div>
          </div>
        ) : (
          <select
            value={selectedStream}
            onChange={(e) => {
              const s = e.target.value;
              setSelectedStream(s);
              setPrograms(OPTIONS[s] || []);
              setSelectedProgram(""); // reset program on stream change
            }}
            className="border rounded p-2 mb-4 w-full"
          >
            <option value="">-- Select stream --</option>
            <option value="bachelors">Bachelor’s</option>
            <option value="masters">Master’s</option>
            <option value="phd">PhD</option>
          </select>
        )}

        {/* Program dropdown */}
        <select
          className="border rounded p-2 mb-4 w-full"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          disabled={!selectedStream}
        >
          <option value="">-- Select a program --</option>
          {programs.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}