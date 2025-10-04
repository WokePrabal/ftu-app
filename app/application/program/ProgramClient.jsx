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

      if (app.program) setSelectedProgram(app.program);

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

  const progress = {
    ...baseProgress,
    selectStream: !!selectedStream,
    program: !!selectedProgram,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar progress={progress} />
      <main className="flex-1 p-6 flex justify-center items-start">
        {/* ✨ Content-sized card */}
        <div className="w-full max-w-lg bg-white shadow rounded-lg p-6 inline-block">
          <h1 className="text-2xl font-semibold mb-6">Program of Study</h1>

          {/* Stream */}
          {selectedStream ? (
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1">
                Selected Stream
              </label>
              <div className="p-3 border rounded bg-gray-100 font-medium">
                {STREAM_LABEL[selectedStream] || selectedStream}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-1">
                Choose Stream
              </label>
              <select
                value={selectedStream}
                onChange={(e) => {
                  const s = e.target.value;
                  setSelectedStream(s);
                  setPrograms(OPTIONS[s] || []);
                  setSelectedProgram("");
                }}
                className="border rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Select stream --</option>
                <option value="bachelors">Bachelor’s</option>
                <option value="masters">Master’s</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          )}

          {/* Program */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">Program</label>
            <select
              className="border rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}