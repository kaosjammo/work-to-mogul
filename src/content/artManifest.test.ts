/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ART_FALLBACK,
  ART_BRAND,
  ART_UI,
  ART_WORK,
  ART_MILESTONE,
  ART_INDUSTRIES,
  ART_BUSINESSES,
  ART_ROLES,
  ART_UPGRADES,
  ART_EMPLOYEES,
} from './artManifest'
import { BUSINESS_ORDER } from './businesses'
import { INDUSTRY_ORDER } from './industries'
import { UPGRADE_ORDER } from './upgrades'
import { ROLE_DEFS } from './roles'
import { EMPLOYEE_TEMPLATES } from './employeeTemplates'

const PUBLIC = join(process.cwd(), 'public')
const onDisk = (webPath: string) => existsSync(join(PUBLIC, webPath.replace(/^\//, '')))

function allPaths(): string[] {
  const paths: string[] = [
    ...Object.values(ART_FALLBACK),
    ...Object.values(ART_BRAND),
    ...Object.values(ART_UI),
    ...Object.values(ART_WORK),
    ...Object.values(ART_MILESTONE),
    ...Object.values(ART_BUSINESSES).map((b) => b.icon),
    ...Object.values(ART_ROLES).map((r) => r.icon),
    ...Object.values(ART_UPGRADES).map((u) => u.icon),
    ...Object.values(ART_EMPLOYEES).map((e) => e.portrait),
  ]
  for (const ind of Object.values(ART_INDUSTRIES)) {
    paths.push(ind.icon)
    if (ind.banner) paths.push(ind.banner)
    if (ind.pattern) paths.push(ind.pattern)
  }
  return paths
}

describe('art manifest', () => {
  it('every referenced asset path exists in public/', () => {
    const missing = allPaths().filter((p) => !onDisk(p))
    expect(missing, `missing files:\n${missing.join('\n')}`).toEqual([])
  })

  it('registry keys reference real content ids (no stale entries)', () => {
    const biz = new Set(BUSINESS_ORDER)
    expect(Object.keys(ART_BUSINESSES).filter((id) => !biz.has(id))).toEqual([])
    const ind = new Set(INDUSTRY_ORDER)
    expect(Object.keys(ART_INDUSTRIES).filter((id) => !ind.has(id))).toEqual([])
    const up = new Set(UPGRADE_ORDER)
    expect(Object.keys(ART_UPGRADES).filter((id) => !up.has(id))).toEqual([])
    const employees = new Set(Object.keys(EMPLOYEE_TEMPLATES))
    expect(Object.keys(ART_EMPLOYEES).filter((id) => !employees.has(id))).toEqual([])
  })

  it('every role has authored art (roles are fully covered)', () => {
    for (const id of Object.keys(ROLE_DEFS)) {
      expect(ART_ROLES[id], `role ${id} missing art`).toBeDefined()
    }
  })

  it('reports content still awaiting art (informational, not a failure)', () => {
    const bizGap = BUSINESS_ORDER.filter((id) => !ART_BUSINESSES[id])
    const indGap = INDUSTRY_ORDER.filter((id) => !ART_INDUSTRIES[id])
    const upGap = UPGRADE_ORDER.filter((id) => !ART_UPGRADES[id])
    const employeeGap = Object.keys(EMPLOYEE_TEMPLATES).filter((id) => !ART_EMPLOYEES[id])
    // eslint-disable-next-line no-console
    console.log(
      `[art] awaiting assets - businesses: ${bizGap.length} (${bizGap.join(', ')}); ` +
        `industries: ${indGap.length} (${indGap.join(', ')}); upgrades: ${upGap.length}; ` +
        `employee portraits: ${employeeGap.length}`,
    )
    expect(true).toBe(true)
  })
})
