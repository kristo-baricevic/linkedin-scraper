import { useState } from 'react'

const LINKEDIN_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i

export default function SearchBar({ onSubmit, loading }) {
  const [url, setUrl] = useState('')
  const [touched, setTouched] = useState(false)

  const valid = !url.trim() || LINKEDIN_PATTERN.test(url.trim())
  const showError = touched && url.trim() && !valid

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed || !LINKEDIN_PATTERN.test(trimmed)) {
      setTouched(true)
      return
    }
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://www.linkedin.com/in/username"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        {showError && (
          <p className="mt-1 text-sm text-red-600">
            Enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username)
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !url.trim() || !valid}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Fetching…' : 'Fetch profile'}
      </button>
    </form>
  )
}
