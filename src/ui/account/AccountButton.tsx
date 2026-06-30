import { useAccountStore } from '../../store/accountStore'
import { useUiStore } from '../../store/uiStore'

// Compact cloud/account status pill for the HUD. Tapping opens the account
// modal. Doubles as the required sync-status indicator.
export function AccountButton() {
  const status = useAccountStore((s) => s.status)
  const user = useAccountStore((s) => s.user)
  const open = useUiStore((s) => s.openAccount)

  const signedIn = !!user
  const { label, dot } = describe(signedIn, status)

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Account — ${label}`}
      title={label}
      className="flex items-center gap-1 rounded-full px-2.5 text-sm"
      style={{
        minHeight: 'var(--tap)',
        minWidth: 'var(--tap)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-dim)',
      }}
    >
      <span aria-hidden>☁</span>
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden />
    </button>
  )
}

function describe(signedIn: boolean, status: string): { label: string; dot: string } {
  if (!signedIn) return { label: 'Local', dot: 'var(--text-faint)' }
  switch (status) {
    case 'syncing':
      return { label: 'Syncing…', dot: 'var(--accent)' }
    case 'synced':
      return { label: 'Synced', dot: 'var(--good)' }
    case 'error':
      return { label: 'Sync failed', dot: 'var(--bad)' }
    default:
      return { label: 'Local', dot: 'var(--text-faint)' }
  }
}
