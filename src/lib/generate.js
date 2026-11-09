export function parseNames(text) {
  const seen = new Set()
  const out = []
  for (const raw of text.split(/[\n,]+/)) {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let idSeed = 0
export function makePerson(name) {
  return { id: `p${Date.now().toString(36)}${(idSeed++).toString(36)}`, name, rating: 3, locked: false, teamId: null }
}

export function generateTeams(people, teamCount, mode) {
  const n = Math.max(1, teamCount)
  const total = people.length
  const base = Math.floor(total / n)
  const extra = total % n
  const targets = Array.from({ length: n }, (_, t) => base + (t < extra ? 1 : 0))

  const locked = people.filter((p) => p.locked && p.teamId != null && p.teamId < n)
  const sizes = Array(n).fill(0)
  const sums = Array(n).fill(0)
  for (const p of locked) {
    sizes[p.teamId]++
    sums[p.teamId] += p.rating
  }

  const shed = []
  for (const p of locked) {
    if (sizes[p.teamId] > targets[p.teamId]) {
      sizes[p.teamId]--
      sums[p.teamId] -= p.rating
      shed.push(p)
    }
  }
  const shedIds = new Set(shed.map((p) => p.id))
  const kept = locked.filter((p) => !shedIds.has(p.id))
  for (const p of shed) p.teamId = null

  const keptIds = new Set(kept.map((p) => p.id))
  const pool = shuffle(people.filter((p) => !keptIds.has(p.id)))
  if (mode === 'rating') pool.sort((a, b) => b.rating - a.rating || Math.random() - 0.5)

  const bucket = Array.from({ length: n }, (_, id) => ({ id, members: kept.filter((p) => p.teamId === id) }))
  for (const p of pool) {
    let best = 0
    for (let t = 1; t < n; t++) {
      const better =
        mode === 'rating'
          ? sums[t] < sums[best] || (sums[t] === sums[best] && sizes[t] < sizes[best])
          : sizes[t] < sizes[best] || (sizes[t] === sizes[best] && sums[t] < sums[best])
      if (better) best = t
    }
    bucket[best].members.push(p)
    sizes[best]++
    sums[best] += p.rating
    p.teamId = best
  }
  return bucket
}

export function teamsToText(teams) {
  return teams
    .map((t) => `Team ${t.id + 1}: ${t.members.map((m) => m.name).join(', ') || '—'}`)
    .join('\n')
}
