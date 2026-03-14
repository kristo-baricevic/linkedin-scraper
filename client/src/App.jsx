import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ResumePDF from "./ResumePDF.jsx";
import ProfileCard from "./components/ProfileCard.jsx";

const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !LINKEDIN_PATTERN.test(trimmed)) {
      setError("Enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username)");
      return;
    }
    setError(null);
    setProfile(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }
      setProfile(data);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const fileName = profile?.name ? `${profile.name.replace(/\s+/g, "-")}-resume.pdf` : "resume.pdf";

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">LinkedIn to PDF Resume</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Scraping…" : "Scrape profile"}
          </button>
        </form>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}
        {profile && (
          <div className="mt-6 space-y-4">
            <ProfileCard profile={profile} />
            <PDFDownloadLink
              document={<ResumePDF profile={profile} />}
              fileName={fileName}
              className="inline-block rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              {({ loading: pdfLoading }) => (pdfLoading ? "Generating PDF…" : "Download PDF")}
            </PDFDownloadLink>
          </div>
        )}
      </div>
    </div>
  );
}
