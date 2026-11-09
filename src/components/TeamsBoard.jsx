import { PALETTE } from '../lib/palette'

export default function TeamsBoard({ teams }) {
  if (!teams) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((t) => {
        const color = PALETTE[t.id % PALETTE.length]
        const sum = t.members.reduce((s, m) => s + m.rating, 0)
        return (
          <section key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <header className="mb-3 flex items-center justify-between">
              <h3 className={`font-bold ${color.header}`}>
                <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${color.dot}`} />
                Team {t.id + 1}
              </h3>
              <span className="text-xs text-slate-500">
                {t.members.length} {t.members.length === 1 ? 'person' : 'people'} · Σ{sum}
              </span>
            </header>
            {t.members.length === 0 ? (
              <p className="text-sm text-slate-600 italic">empty</p>
            ) : (
              <ul className="space-y-1.5">
                {t.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-200">{m.name}</span>
                    {m.locked && <span title="Locked">🔒</span>}
                    <span className="ml-auto flex gap-0.5" title={`Skill ${m.rating}/5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < m.rating ? 'text-amber-400' : 'text-slate-700'}>
                          ★
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
