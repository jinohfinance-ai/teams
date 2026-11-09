import { PALETTE } from '../lib/palette'

export default function Roster({ roster, hasTeams, onRate, onLock, onRemove }) {
  if (roster.length === 0) {
    return <p className="text-sm text-slate-500">No people yet — add names above.</p>
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {roster.map((p) => {
        const color = PALETTE[p.teamId ?? 0]
        return (
          <li
            key={p.id}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
              p.teamId != null ? color.chip : 'bg-slate-800/60 border-slate-700 text-slate-200'
            }`}
          >
            {p.teamId != null && <span className={`h-2 w-2 rounded-full ${color.dot}`} />}
            <span className="font-medium">{p.name}</span>
            <span className="ml-1 flex items-center gap-0.5 text-xs text-slate-400">
              <button
                onClick={() => onRate(p.id, -1)}
                className="h-5 w-5 rounded-full bg-slate-700/70 hover:bg-slate-600 transition-colors"
                title="Lower rating"
              >
                −
              </button>
              <span className="w-6 text-center tabular-nums" title={`Skill ${p.rating}/5`}>
                {p.rating}
              </span>
              <button
                onClick={() => onRate(p.id, +1)}
                className="h-5 w-5 rounded-full bg-slate-700/70 hover:bg-slate-600 transition-colors"
                title="Raise rating"
              >
                +
              </button>
            </span>
            <button
              onClick={() => onLock(p.id)}
              disabled={!hasTeams}
              className={`ml-0.5 text-sm transition-opacity ${
                p.locked ? 'opacity-100' : hasTeams ? 'opacity-40 hover:opacity-100' : 'opacity-20'
              }`}
              title={hasTeams ? (p.locked ? 'Unlock (free to move)' : 'Lock to current team') : 'Generate teams first'}
            >
              {p.locked ? '🔒' : '🔓'}
            </button>
            <button
              onClick={() => onRemove(p.id)}
              className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
              title="Remove"
            >
              ×
            </button>
          </li>
        )
      })}
    </ul>
  )
}
