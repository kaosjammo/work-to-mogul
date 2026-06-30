import type { TabId } from '../../types/domain'
import { useActiveTab, useRevealedTabs } from '../../store/gameStore'
import { setActiveTab } from '../../store/actions'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'business', label: 'Business', icon: '🏭' },
  { id: 'employees', label: 'Staff', icon: '👥' },
  { id: 'upgrades', label: 'Upgrades', icon: '⚡' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'prestige', label: 'Ascend', icon: '✦' },
]

export function NavBar() {
  const active = useActiveTab()
  const revealed = useRevealedTabs()
  // Business is always shown; others reveal as the player progresses (onboarding).
  const visibleTabs = TABS.filter(
    (t) => t.id === 'business' || revealed[t.id as 'employees' | 'upgrades' | 'prestige' | 'stats'],
  )
  return (
    <nav
      className="z-20 flex border-t"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
            style={{
              minHeight: 'var(--nav-h)',
              color: isActive ? 'var(--accent)' : 'var(--text-faint)',
              // Clear active state: subtle tint + a top accent bar.
              background: isActive ? 'rgba(245,197,24,0.08)' : 'transparent',
              boxShadow: isActive ? 'inset 0 2px 0 var(--accent)' : 'none',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
