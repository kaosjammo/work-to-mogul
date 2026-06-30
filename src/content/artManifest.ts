// ============================================================
//  Art registry - maps content ids to SVG asset paths under /public/assets.
//  Only ids with authored art are listed; ui/shared/art.ts falls back to a
//  category SVG or emoji for everything else, so adding content without art
//  degrades gracefully. A dev-time test asserts coverage.
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

export const ART_GENERATED = {
  background: {
    tycoonCity: '/assets/generated/backgrounds/tycoon_city_background.png',
  },
  mascot: {
    founderIdle: '/assets/generated/mascot/founder_idle.png',
    founderWorking: '/assets/generated/mascot/founder_working.png',
    founderExcited: '/assets/generated/mascot/founder_excited.png',
    founderUpgrade: '/assets/generated/mascot/founder_upgrade.png',
    founderPoseSheet: '/assets/generated/mascot/founder_pose_sheet.png',
  },
  props: {
    moneyBag: '/assets/generated/props/money_bag.png',
    cashStack: '/assets/generated/props/cash_stack.png',
    coinPile: '/assets/generated/props/coin_pile.png',
    cashBriefcase: '/assets/generated/props/cash_briefcase.png',
    profitBurst: '/assets/generated/props/profit_burst.png',
    flyingBanknotes: '/assets/generated/props/flying_banknotes.png',
    moneyPropSheet: '/assets/generated/props/money_prop_sheet.png',
  },
  vfx: {
    cashBurstSheet: '/assets/generated/vfx/cash_burst_sheet.png',
    cashBurstFrames: [
      '/assets/generated/vfx/cash_burst_01.png',
      '/assets/generated/vfx/cash_burst_02.png',
      '/assets/generated/vfx/cash_burst_03.png',
      '/assets/generated/vfx/cash_burst_04.png',
      '/assets/generated/vfx/cash_burst_05.png',
      '/assets/generated/vfx/cash_burst_06.png',
      '/assets/generated/vfx/cash_burst_07.png',
      '/assets/generated/vfx/cash_burst_08.png',
    ],
  },
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
  logistics: {
    icon: '/assets/icons/industries/industry_logistics.svg',
    banner: '/assets/banners/industries/industry_logistics.svg',
    pattern: '/assets/patterns/pattern_logistics.svg',
  },
  energy: {
    icon: '/assets/icons/industries/industry_energy.svg',
    banner: '/assets/banners/industries/industry_energy.svg',
    pattern: '/assets/patterns/pattern_energy.svg',
  },
  space: {
    icon: '/assets/icons/industries/industry_space.svg',
    banner: '/assets/banners/industries/industry_space.svg',
    pattern: '/assets/patterns/pattern_space.svg',
  },
}

const BIZ = (id: string) => `/assets/icons/businesses/business_${id}.svg`
export const ART_BUSINESSES: Record<string, { icon: string }> = Object.fromEntries(
  [
    'lemonade', 'food_truck', 'pizzeria', 'sushi_bar',
    'corner_shop', 'barbershop', 'gym', 'department_store',
    'mobile_app', 'streaming', 'saas', 'ai_lab',
    'apartments', 'fund', 'skyscraper',
    'courier', 'trucking', 'cargo_port', 'air_freight',
    'solar_farm', 'wind_park', 'hydro_dam', 'fusion_plant',
    'satellite', 'rocket_pad', 'asteroid_mine', 'mars_colony',
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
  food_speed_2x: { icon: '/assets/icons/upgrades/upgrade_food_speed_2x.svg' },
  retail_profit_2x: { icon: '/assets/icons/upgrades/upgrade_retail_profit_2x.svg' },
  global_speed_15: { icon: '/assets/icons/upgrades/upgrade_global_speed_15.svg' },
  tech_profit_2x: { icon: '/assets/icons/upgrades/upgrade_tech_profit_2x.svg' },
  tech_speed_2x: { icon: '/assets/icons/upgrades/upgrade_tech_speed_2x.svg' },
  global_profit_2x: { icon: '/assets/icons/upgrades/upgrade_global_profit_2x.svg' },
  logistics_profit_2x: { icon: '/assets/icons/upgrades/upgrade_logistics_profit_2x.svg' },
  finance_profit_2x: { icon: '/assets/icons/upgrades/upgrade_finance_profit_2x.svg' },
  global_speed_2x: { icon: '/assets/icons/upgrades/upgrade_global_speed_2x.svg' },
  energy_profit_2x: { icon: '/assets/icons/upgrades/upgrade_energy_profit_2x.svg' },
  global_profit_3x: { icon: '/assets/icons/upgrades/upgrade_global_profit_3x.svg' },
  space_profit_2x: { icon: '/assets/icons/upgrades/upgrade_space_profit_2x.svg' },
}

const EMPLOYEE = (id: string) => `/assets/portraits/employees/${id}.svg`
export const ART_EMPLOYEES: Record<string, { portrait: string }> = Object.fromEntries(
  [
    'flash_ortega',
    'mickey_gears',
    'thrifty_tom',
    'maxine_hustle',
    'sunny_brooks',
    'penny_frugal',
    'marco_vance',
    'lady_luck',
    'nada_hawk',
    'rosa_swift',
    'watt_sterling',
    'nova_star',
    'nova_quick',
    'dot_matrix',
    'cargo_kate',
    'cole_voltaic',
    'astra_vance',
  ].map((id) => [id, { portrait: EMPLOYEE(id) }]),
)
