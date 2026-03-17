import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SearchBar from "./components/SearchBar";
import ProfileCard from "./components/ProfileCard";
import ResumePDF from "./components/ResumePDF";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(searchQueryOrUrl) {
    setError(null);
    setProfile(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery: searchQueryOrUrl,
          url: searchQueryOrUrl,
        }),
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (_) {
        setError(
          res.ok
            ? "Invalid response from server."
            : `Request failed (${res.status}). ${text.slice(0, 200) || "Please check the URL and try again."}`
        );
        return;
      }
      if (!res.ok) {
        const message =
          data.error ||
          (res.status === 404 || res.status === 400
            ? "That LinkedIn profile couldn't be found. Please check the URL or username and try again."
            : "Something went wrong. Please check the URL and try again.");
        setError(message);
        return;
      }
      setProfile(data);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">
          LinkedIn Profile Scraper
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md bg-slate-100">
          <SearchBar onSubmit={handleSubmit} loading={loading} />
          {profile && (
            <div className="mt-4">
              <PDFDownloadLink
                document={<ResumePDF profile={profile} />}
                fileName={
                  profile.name
                    ? `${profile.name.replace(/\s+/g, "-")}-resume.pdf`
                    : "resume.pdf"
                }
                className="inline-block rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                {({ loading }) =>
                  loading ? "Generating PDF…" : "Download PDF"
                }
              </PDFDownloadLink>
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
          {profile && (
            <div className="mt-6">
              <ProfileCard profile={profile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
