import { useEffect, useState } from 'react'
import Roster from './components/Roster'
import TeamsBoard from './components/TeamsBoard'
import { generateTeams, makePerson, parseNames, teamsToText } from './lib/generate'

const LS_ROSTER = 'teams.roster'
const LS_SETTINGS = 'teams.settings'
const LS_HISTORY = 'teams.history'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [input, setInput] = useState('')
  const [roster, setRoster] = useState(() => load(LS_ROSTER, []))
  const [teamCount, setTeamCount] = useState(() => load(LS_SETTINGS, {}).teamCount ?? 2)
  const [mode, setMode] = useState(() => load(LS_SETTINGS, {}).mode ?? 'count')
  const [teams, setTeams] = useState(null)
  const [history, setHistory] = useState(() => load(LS_HISTORY, []))
  const [copied, setCopied] = useState(false)

  useEffect(() => localStorage.setItem(LS_ROSTER, JSON.stringify(roster)), [roster])
  useEffect(() => localStorage.setItem(LS_SETTINGS, JSON.stringify({ teamCount, mode })), [teamCount, mode])
  useEffect(() => localStorage.setItem(LS_HISTORY, JSON.stringify(history)), [history])

  const hasTeams = teams != null

  function addPeople() {
    const names = parseNames(input)
    if (names.length === 0) return
    const existing = new Set(roster.map((p) => p.name.toLowerCase()))
    const fresh = names.filter((n) => !existing.has(n.toLowerCase())).map(makePerson)
    if (fresh.length > 0) {
      setRoster((r) => [...r, ...fresh])
      setTeams(null)
    }
    setInput('')
  }

  function removePerson(id) {
    setRoster((r) => r.filter((p) => p.id !== id))
    setTeams(null)
  }

  function adjustRating(id, delta) {
    setRoster((r) => r.map((p) => (p.id === id ? { ...p, rating: Math.min(5, Math.max(1, p.rating + delta)) } : p)))
  }

  function toggleLock(id) {
    setRoster((r) => r.map((p) => (p.id === id ? { ...p, locked: !p.locked } : p)))
  }

  function generate() {
    if (roster.length === 0) return
    const working = roster.map((p) => ({ ...p }))
    const result = generateTeams(working, teamCount, mode)
    setRoster(working)
    setTeams(result)
    setHistory((h) =>
      [
        {
          ts: Date.now(),
          mode,
          teamCount,
          teams: result.map((t) => t.members.map((m) => ({ name: m.name, rating: m.rating }))),
        },
        ...h,
      ].slice(0, 10)
    )
  }

  function clearAll() {
    setRoster((r) => r.map((p) => ({ ...p, teamId: null, locked: false })))
    setTeams(null)
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function download() {
    if (!hasTeams) return
    const blob = new Blob([teamsToText(teams)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teams-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalSum = roster.reduce((s, p) => s + p.rating, 0)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">Teams</span> —
            split people, fairly
          </h1>
          <p className="mt-1 text-sm text-slate-400">Random balanced teams with locks, skill ratings and history.</p>
        </div>
        <span className="hidden rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 sm:block">
          {roster.length} people · Σ{totalSum}
        </span>
      </header>

      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
        <label htmlFor="names" className="mb-2 block text-sm font-semibold text-slate-300">
          Add people <span className="font-normal text-slate-500">(one per line or comma-separated)</span>
        </label>
        <textarea
          id="names"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addPeople()
          }}
          rows={3}
          placeholder={'Alice\nBob, Carol\nDave'}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-sm placeholder-slate-600 focus:border-sky-500 focus:outline-none"
        />
        <button
          onClick={addPeople}
          disabled={!input.trim()}
          className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500 disabled:opacity-40 transition-colors"
        >
          Add to roster
        </button>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Roster</h2>
        <Roster roster={roster} hasTeams={hasTeams} onRate={adjustRating} onLock={toggleLock} onRemove={removePerson} />
      </section>

      <section className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Teams</span>
          <button
            onClick={() => setTeamCount((c) => Math.max(1, c - 1))}
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">{teamCount}</span>
          <button
            onClick={() => setTeamCount((c) => Math.min(10, c + 1))}
            className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            +
          </button>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-700">
          {['count', 'rating'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === m ? 'bg-violet-600 font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {m === 'count' ? 'Balance by count' : 'Balance by skill'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={generate}
            disabled={roster.length === 0}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40 transition-colors"
          >
            Generate
          </button>
          <button
            onClick={generate}
            disabled={!hasTeams}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600 disabled:opacity-40 transition-colors"
            title="Re-randomize (locked people stay)"
          >
            Shuffle
          </button>
          <button
            onClick={clearAll}
            disabled={!hasTeams}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            Clear
          </button>
        </div>
      </section>

      {hasTeams && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h2>
            <div className="flex gap-2">
              <button
                onClick={() => copyText(teamsToText(teams))}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={download}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Download .txt
              </button>
            </div>
          </div>
          <TeamsBoard teams={teams} />
        </section>
      )}

      {history.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              History <span className="normal-case text-slate-600">(last {history.length})</span>
            </h2>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear history
            </button>
          </div>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.ts} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>{new Date(h.ts).toLocaleString()}</span>
                  <span className="rounded bg-slate-800 px-1.5">
                    {h.teamCount} teams · {h.mode === 'rating' ? 'skill' : 'count'}
                  </span>
                  <button
                    onClick={() => copyText(teamsToText(h.teams.map((m, id) => ({ id, members: m }))))}
                    className="ml-auto hover:text-slate-300 transition-colors"
                  >
                    copy
                  </button>
                </div>
                <p className="text-slate-300">{teamsToText(h.teams.map((m, id) => ({ id, members: m }))).replaceAll('\n', ' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-slate-600">Data lives in your browser only. No server.</footer>
    </main>
  )
}
