// Resolve content ids to art. Returns an SVG src when authored, otherwise a
// category-fallback SVG or a passed-in emoji (so un-arted content still shows
// something sensible). Pure lookups — safe to call in render.
import {
  ART_BUSINESSES,
  ART_INDUSTRIES,
  ART_ROLES,
  ART_UPGRADES,
  ART_EMPLOYEES,
  ART_FALLBACK,
  ART_MILESTONE,
} from '../../content/artManifest'

export type ArtRef = { src: string } | { emoji: string }

export function businessArt(id: string, emoji?: string): ArtRef {
  const hit = ART_BUSINESSES[id]
  if (hit) return { src: hit.icon }
  return emoji ? { emoji } : { src: ART_FALLBACK.business }
}

export function industryArt(id: string): ArtRef {
  const hit = ART_INDUSTRIES[id]
  return hit ? { src: hit.icon } : { src: ART_FALLBACK.industry }
}

export function industryBanner(id: string): string | null {
  return ART_INDUSTRIES[id]?.banner ?? null
}

export function industryPattern(id: string): string | null {
  return ART_INDUSTRIES[id]?.pattern ?? null
}

export function roleArt(id: string, emoji?: string): ArtRef {
  const hit = ART_ROLES[id]
  if (hit) return { src: hit.icon }
  return emoji ? { emoji } : { src: ART_FALLBACK.role }
}

export function employeeArt(templateId: string): ArtRef {
  const hit = ART_EMPLOYEES[templateId]
  return hit ? { src: hit.portrait } : { src: '/assets/portraits/employees/employee_fallback.svg' }
}

/** Upgrade icon path: per-upgrade art if authored, else a milestone icon by effect. */
export function upgradeArtSrc(
  id: string,
  effectKind: 'profitMult' | 'speedMult' | 'costReduction',
): string {
  return ART_UPGRADES[id]?.icon ?? ART_MILESTONE[effectKind] ?? ART_FALLBACK.unavailable
}
