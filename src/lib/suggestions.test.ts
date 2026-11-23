import { describe, expect, it } from 'vitest'
import { normalize, rankSuggestions } from '@/lib/suggestions'

const stats = [
  { description: 'Code review – Project X', times_used: 24, last_used: '2026-11-21' },
  { description: 'Review – Project Y', times_used: 6, last_used: '2026-11-14' },
  { description: 'Daily Stand-up', times_used: 40, last_used: '2026-11-23' },
  { description: 'Übergabe an Kunden', times_used: 3, last_used: '2026-10-01' },
  { description: 'Besprechung Straße', times_used: 2, last_used: '2026-11-20' },
]

const texts = (query: string) => rankSuggestions(stats, query, '2026-11-23').map((s) => s.text)

describe('suggestions', () => {
  it('ignores case and umlauts', () => {
    expect(normalize('Übergabe')).toBe('ubergabe')
    expect(normalize('uebergabe')).toBe('ubergabe')
    expect(normalize('Straße')).toBe('strasse')
    expect(texts('ubergabe')).toEqual(['Übergabe an Kunden'])
    expect(texts('strasse')).toEqual(['Besprechung Straße'])
  })

  it('matches word beginnings in any order', () => {
    // Both match; "Review …" first because its first word starts with "rev"
    expect(texts('rev pro')).toEqual(['Review – Project Y', 'Code review – Project X'])
    expect(texts('xyz')).toEqual([])
  })

  it('offers parts of descriptions', () => {
    const suggestions = rankSuggestions(stats, 'proj x', '2026-11-23')
    expect(suggestions[0]).toMatchObject({ text: 'Project X', isPart: true })
  })

  it('shows the most used descriptions for an empty query', () => {
    expect(texts('')[0]).toBe('Daily Stand-up')
  })
})
