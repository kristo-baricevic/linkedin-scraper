import { useState, useRef, useEffect } from "react";

const VALIDATION_DELAY_MS = 500;

function isValidLinkedInUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    return (
      parsed.hostname.toLowerCase().includes("linkedin.com") &&
      /^\/in\/[\w.-]+\/?$/i.test(parsed.pathname)
    );
  } catch (_) {
    return false;
  }
}

export default function SearchBar({ onSubmit, loading }) {
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef(null);

  const trimmed = input.trim();
  const valid = isValidLinkedInUrl(input);
  const showError = touched && trimmed && !valid;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function scheduleTouched() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setTouched(true);
    }, VALIDATION_DELAY_MS);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!trimmed || !valid) {
      setTouched(true);
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTouched(false);
            scheduleTouched();
          }}
          onBlur={() => {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
              debounceRef.current = null;
            }
            setTouched(true);
          }}
          placeholder="LinkedIn profile URL (e.g. linkedin.com/in/johndoe)"
          className={`w-full rounded-lg border px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 disabled:opacity-70 ${
            showError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          disabled={loading}
          aria-invalid={showError}
          aria-describedby={showError ? "searchbar-error" : undefined}
        />
        {showError && (
          <p id="searchbar-error" className="mt-1 text-sm text-red-600">
            This is not a valid LinkedIn address. Enter a profile URL (e.g. linkedin.com/in/username).
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !trimmed || !valid}
        className="rounded-lg bg-blue-800 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Fetching…" : "Fetch profile"}
      </button>
    </form>
  );
}
