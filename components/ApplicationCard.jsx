// components/ApplicationCard.jsx
"use client";
import { useRouter } from "next/navigation";

export default function ApplicationCard({ app }) {
  const router = useRouter();

  const getId = (a) =>
    a?._id ??
    a?.id ??
    a?.raw?._id ??
    a?._doc?._id ??
    a?.applicationId ??
    null;

  const id = getId(app);

  const handleClick = () => {
    if (!id) {
      console.warn("ApplicationCard: missing id", app);
      alert("Application id missing. Check console.");
      return;
    }
    if ((app.status || "").toString().toLowerCase() === "submitted") {
      alert("Application already submitted");
      return;
    }
    // go to multi-step stream with id so it pre-fills
    router.push(`/application/stream?id=${encodeURIComponent(id)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="border rounded p-4 hover:shadow-md transition cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {app.title || app.fullname || "Untitled"}
        </h3>
        <span
          className={
            "text-sm px-2 py-1 rounded " +
            ((app.status || "").toString().toLowerCase() === "submitted"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800")
          }
        >
          {app.status || "Draft"}
        </span>
      </div>
    </div>
  );
}