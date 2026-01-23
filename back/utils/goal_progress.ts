export type ProgressStepLike = { isCompleted?: boolean; is_completed?: boolean }

/**
 * Règle:
 * - 0 step => 0%
 * - progression = (completed / total) * 100
 * - arrondi à l'entier (Math.round) pour un résultat propre
 */
export function calculateGoalProgress(steps: ProgressStepLike[]): number {
  const total = steps.length
  if (total === 0) return 0

  const completed = steps.filter((s) => s.isCompleted === true || s.is_completed === true).length
  const pct = Math.round((completed / total) * 100)

  // sécurité
  return Math.min(100, Math.max(0, pct))
}
