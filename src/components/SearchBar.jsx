import { useState } from 'react'

export default function SearchBar({ onSubmit, loading }) {
  const [input, setInput] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="LinkedIn profile URL or search (e.g. name or job title)"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
