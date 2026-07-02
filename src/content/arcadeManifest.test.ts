/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  allArcadePaths,
  ARCADE_FLEETS,
  ARCADE_PLAYER,
  ARCADE_PICKUPS,
} from './arcadeManifest'

const PUBLIC = join(process.cwd(), 'public')
const onDisk = (webPath: string) => existsSync(join(PUBLIC, webPath.replace(/^\//, '')))

describe('arcade asset manifest', () => {
  it('every referenced arcade asset exists under public/ (not dist/)', () => {
    const missing = allArcadePaths().filter((p) => !onDisk(p))
    expect(missing, `missing arcade files:\n${missing.join('\n')}`).toEqual([])
  })

  it('every path is served from the source-controlled public/assets/arcade path', () => {
    for (const p of allArcadePaths()) {
      expect(p.startsWith('/assets/arcade/foozle/'), `runtime path escapes the arcade dir: ${p}`).toBe(true)
      expect(p.includes('dist/'), `runtime path must not point at dist/: ${p}`).toBe(false)
    }
  })

  it('ships a full 3-fleet / 4-damage-state / 3-pickup roster', () => {
    expect(Object.keys(ARCADE_FLEETS)).toEqual(['1', '2', '3'])
    expect(ARCADE_PLAYER.hull).toHaveLength(4)
    expect(Object.keys(ARCADE_PICKUPS).sort()).toEqual(['core', 'shield', 'weapon'])
  })
})
