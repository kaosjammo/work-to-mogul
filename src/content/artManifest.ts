// ============================================================
//  Art registry — maps content ids to SVG asset paths under /public/assets.
//  Only ids with authored art are listed; resolveArt() (ui/shared/art.ts)
//  falls back to a category SVG or an emoji for everything else, so adding
//  content without art degrades gracefully. A dev-time test asserts coverage.
// ============================================================

export const ART_FALLBACK = {
  business: '/assets/icons/ui/fallback_business.svg',
  industry: '/assets/icons/ui/fallback_industry.svg',
  role: '/assets/icons/ui/fallback_role.svg',
  unavailable: '/assets/icons/ui/icon_unaffordable.svg',
}

export const ART_BRAND = {
  appIcon: '/assets/brand/app_icon.svg',
  markMono: '/assets/brand/brand_mark_mono.svg',
}

export const ART_UI = {
  cash: '/assets/icons/ui/icon_cash.svg',
  buy: '/assets/icons/ui/icon_buy.svg',
  incomeRate: '/assets/icons/ui/icon_income_rate.svg',
  locked: '/assets/icons/ui/icon_locked.svg',
  staff: '/assets/icons/ui/icon_staff.svg',
  upgrade: '/assets/icons/ui/icon_upgrade.svg',
  milestone: '/assets/icons/ui/icon_milestone.svg',
  ascend: '/assets/icons/ui/icon_ascend.svg',
}

export const ART_WORK = {
  shift: '/assets/icons/work/work_shift.svg',
  promotion: '/assets/icons/work/work_promotion.svg',
}

export const ART_MILESTONE = {
  profitMult: '/assets/icons/milestones/milestone_profit.svg',
  speedMult: '/assets/icons/milestones/milestone_speed.svg',
  costReduction: '/assets/icons/milestones/milestone_cost.svg',
}

// --- per-id registries (only the ids that have authored art) ---

export const ART_INDUSTRIES: Record<string, { icon: string; banner?: string; pattern?: string }> = {
  food: {
    icon: '/assets/icons/industries/industry_food.svg',
    banner: '/assets/banners/industries/industry_food.svg',
    pattern: '/assets/patterns/pattern_food.svg',
  },
  retail: {
    icon: '/assets/icons/industries/industry_retail.svg',
    banner: '/assets/banners/industries/industry_retail.svg',
    pattern: '/assets/patterns/pattern_retail.svg',
  },
  tech: {
    icon: '/assets/icons/industries/industry_tech.svg',
    banner: '/assets/banners/industries/industry_tech.svg',
    pattern: '/assets/patterns/pattern_tech.svg',
  },
  finance: {
    icon: '/assets/icons/industries/industry_finance.svg',
    banner: '/assets/banners/industries/industry_finance.svg',
    pattern: '/assets/patterns/pattern_finance.svg',
  },
  // logistics / energy / space: no art yet → fallback_industry.svg
}

const BIZ = (id: string) => `/assets/icons/businesses/business_${id}.svg`
export const ART_BUSINESSES: Record<string, { icon: string }> = Object.fromEntries(
  [
    'lemonade', 'food_truck', 'pizzeria', 'sushi_bar',
    'corner_shop', 'barbershop', 'gym', 'department_store',
    'mobile_app', 'streaming', 'saas', 'ai_lab',
    'apartments', 'fund', 'skyscraper',
  ].map((id) => [id, { icon: BIZ(id) }]),
)

const ROLE = (id: string) => `/assets/icons/roles/role_${id}.svg`
export const ART_ROLES: Record<string, { icon: string }> = Object.fromEntries(
  ['operator', 'runner', 'closer', 'buyer', 'gambler', 'auditor', 'hr'].map((id) => [
    id,
    { icon: ROLE(id) },
  ]),
)

export const ART_UPGRADES: Record<string, { icon: string }> = {
  lemonade_2x: { icon: '/assets/icons/upgrades/upgrade_lemonade_2x.svg' },
  food_industry_25: { icon: '/assets/icons/upgrades/upgrade_food_industry_25.svg' },
  global_speed_15: { icon: '/assets/icons/upgrades/upgrade_global_speed_15.svg' },
  tech_profit_2x: { icon: '/assets/icons/upgrades/upgrade_tech_profit_2x.svg' },
}
