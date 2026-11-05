// Killed share of personnel casualties: killed / (killed + wounded) × 100, rounded to 0.1.
// Returns null when there are no casualties (rendered as a gap, not 0%).
export function killedShare(killed: number, wounded: number): number | null {
  const total = killed + wounded;
  return total > 0 ? Math.round((killed / total) * 1000) / 10 : null;
}

// Casualty-weighted killed share across several rows (Σkilled / Σcasualties)
export function weightedKilledShare(rows: Array<{ killed: number; wounded: number }>): number | null {
  const killed = rows.reduce((s, r) => s + r.killed, 0);
  const wounded = rows.reduce((s, r) => s + r.wounded, 0);
  return killedShare(killed, wounded);
}
