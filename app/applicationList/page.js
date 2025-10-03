// app/applicationList/page.js
import ApplicationCard from "../../components/ApplicationCard";

export const dynamic = "force-dynamic";

async function fetchApplications() {
  const envBase = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const defaultDev =
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : undefined;
  const baseURL = envBase || defaultDev || "http://localhost:3000";
  const url = `${baseURL.replace(/\/$/, "")}/api/applications`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error("fetchApplications failed", {
        url,
        status: res.status,
        statusText: res.statusText,
        bodyPreview: raw?.slice?.(0, 300),
      });
      return { apps: [], error: `API returned ${res.status}` };
    }

    try {
      const json = JSON.parse(raw);
      const apps =
        json.data || json.applications || (Array.isArray(json) ? json : []);
      return { apps, error: null };
    } catch (parseErr) {
      console.error("fetchApplications JSON parse error", parseErr, raw);
      return { apps: [], error: "Invalid JSON" };
    }
  } catch (err) {
    console.error("fetchApplications network error", err);
    if (err && err.code === "ECONNREFUSED") {
      console.error(
        `Connection refused when calling ${url}. Is the Next server listening on that address/port? Try 'curl ${url}' from the server.`
      );
    }
    return { apps: [], error: "Network error" };
  }
}

export default async function Page() {
  const { apps = [], error } = await fetchApplications();

  const normalized = (a) => ({
    _id: a._id ?? a.id,
    fullname: a.fullname ?? a.fullName ?? a.name,
    program: a.program,
    stream: a.stream,
    status: (a.status ?? "Draft").toString(),
  });

  const all = (apps || []).map(normalized);
  const submitted = all.filter((a) => a.status.toLowerCase() === "submitted");
  const pending = all.filter((a) => a.status.toLowerCase() !== "submitted");

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Applications</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submitted */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Submitted ({submitted.length})
          </h2>
          {submitted.length === 0 ? (
            <p className="text-gray-600">No submitted applications yet.</p>
          ) : (
            <div className="space-y-4">
              {submitted.map((app) => (
                <ApplicationCard
                  key={app._id}
                  app={{
                    _id: app._id,
                    title: app.fullname || app.program || "Untitled",
                    status: app.status,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pending */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-600">No pending applications.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((app) => (
                <ApplicationCard
                  key={app._id}
                  app={{
                    _id: app._id,
                    title: app.fullname || app.program || "Untitled",
                    status: app.status,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}