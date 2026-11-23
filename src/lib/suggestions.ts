import type { DescriptionStat } from '@/types/entry'

export interface Suggestion {
  text: string
  isPart: boolean // a piece of a description, e.g. "Project X" from "Code review – Project X"
  timesUsed: number
  lastUsed: string
}

// " – ", " - ", ",", ":" and "/" separate parts; hyphens inside words (Stand-up) don't
const PART_SEPARATOR = /\s[–-]\s|[,:/]/

// Case- and umlaut-insensitive: "Übergabe", "uebergabe" and "ubergabe" all become "ubergabe"
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ae/g, 'a')
    .replace(/oe/g, 'o')
    .replace(/ue/g, 'u')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function toWords(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function daysBetween(fromDate: string, toDate: string): number {
  return Math.max(0, (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000)
}

// Frequent and recent descriptions first; unused for 30 days = half the weight
function score(candidate: Suggestion, matchQuality: number, today: string): number {
  const frequency = 1 + Math.log(1 + candidate.timesUsed)
  const recency = 0.5 ** (daysBetween(candidate.lastUsed, today) / 30)
  return matchQuality * frequency * recency
}

// Full descriptions plus their parts (parts sum up the usage of all descriptions they appear in)
function buildCandidates(stats: DescriptionStat[]): Suggestion[] {
  const descriptions: Suggestion[] = []
  const parts = new Map<string, Suggestion>()

  for (const stat of stats) {
    descriptions.push({
      text: stat.description,
      isPart: false,
      timesUsed: stat.times_used,
      lastUsed: stat.last_used,
    })

    const pieces = stat.description.split(PART_SEPARATOR).map((piece) => piece.trim())
    if (pieces.length < 2) continue

    for (const piece of pieces) {
      if (piece.length < 2) continue
      const key = normalize(piece)
      const existing = parts.get(key)
      if (existing) {
        existing.timesUsed += stat.times_used
        if (stat.last_used > existing.lastUsed) existing.lastUsed = stat.last_used
      } else {
        parts.set(key, {
          text: piece,
          isPart: true,
          timesUsed: stat.times_used,
          lastUsed: stat.last_used,
        })
      }
    }
  }

  return [...descriptions, ...parts.values()]
}

// Empty query: most used descriptions (for the quick chips). Otherwise every typed word
// must be the start of a word in the suggestion, in any order: "rev pro" → "Code review – Project X"
export function rankSuggestions(
  stats: DescriptionStat[],
  query: string,
  today: string,
  limit = 6,
): Suggestion[] {
  const candidates = buildCandidates(stats)
  const trimmedQuery = normalize(query.trim())

  if (!trimmedQuery) {
    return candidates
      .filter((candidate) => !candidate.isPart)
      .sort((a, b) => score(b, 1, today) - score(a, 1, today))
      .slice(0, limit)
  }

  const queryWords = toWords(query)
  const ranked = []

  for (const candidate of candidates) {
    const normalizedText = normalize(candidate.text)
    if (normalizedText === trimmedQuery) continue

    const words = toWords(candidate.text)
    const allWordsMatch = queryWords.every((queryWord) =>
      words.some((word) => word.startsWith(queryWord)),
    )
    if (!allWordsMatch) continue

    const startsWithQuery = words[0]?.startsWith(queryWords[0] ?? '') ?? false
    const matchQuality = startsWithQuery ? 2 : 1
    ranked.push({ candidate, value: score(candidate, matchQuality, today) })
  }

  return ranked
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((item) => item.candidate)
}
