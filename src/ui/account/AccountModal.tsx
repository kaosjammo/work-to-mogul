import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { money } from '../../engine/num'
import { useAccountStore } from '../../store/accountStore'
import { useUiStore } from '../../store/uiStore'
import type { SaveSummary } from '../../save/saveManager'

export function AccountModal() {
  const accountOpen = useUiStore((s) => s.accountOpen)
  const close = useUiStore((s) => s.closeAccount)

  const configured = useAccountStore((s) => s.configured)
  const user = useAccountStore((s) => s.user)
  const status = useAccountStore((s) => s.status)
  const authBusy = useAccountStore((s) => s.authBusy)
  const authError = useAccountStore((s) => s.authError)
  const authNotice = useAccountStore((s) => s.authNotice)
  const conflict = useAccountStore((s) => s.conflict)
  const signIn = useAccountStore((s) => s.signIn)
  const signUp = useAccountStore((s) => s.signUp)
  const signOut = useAccountStore((s) => s.signOut)
  const syncNow = useAccountStore((s) => s.syncNow)
  const resolveConflict = useAccountStore((s) => s.resolveConflict)
  const clearAuthMessages = useAccountStore((s) => s.clearAuthMessages)

  const [email, setEmailRaw] = useState('')
  const [password, setPasswordRaw] = useState('')
  // Editing clears any stale auth error/notice.
  const setEmail = (v: string) => {
    setEmailRaw(v)
    if (authError || authNotice) clearAuthMessages()
  }
  const setPassword = (v: string) => {
    setPasswordRaw(v)
    if (authError || authNotice) clearAuthMessages()
  }

  // A pending conflict forces the modal open until the player chooses.
  const open = accountOpen || conflict != null

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o && !conflict) close()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => conflict && e.preventDefault()}
          onPointerDownOutside={(e) => conflict && e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-24px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {conflict ? (
            <ConflictChooser
              local={conflict.local}
              cloud={conflict.cloud}
              onChoose={(c) => resolveConflict(c)}
              busy={status === 'syncing'}
            />
          ) : !configured ? (
            <NotConfigured onClose={close} />
          ) : user ? (
            <SignedIn
              email={user.email}
              status={status}
              onSync={syncNow}
              onSignOut={signOut}
              onClose={close}
            />
          ) : (
            <SignedOut
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              busy={authBusy}
              error={authError}
              notice={authNotice}
              onSignIn={() => signIn(email, password)}
              onSignUp={() => signUp(email, password)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---- sub-views ----

function Title({ children }: { children: ReactNode }) {
  return <Dialog.Title className="text-lg font-bold">{children}</Dialog.Title>
}

function NotConfigured({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Title>Cloud save</Title>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Cloud accounts aren’t enabled on this build, so your progress is saved
        <span className="font-semibold"> locally on this device</span>. That keeps
        working fully — you just won’t sync across devices yet.
      </p>
      <SecondaryButton onClick={onClose}>Got it</SecondaryButton>
    </>
  )
}

function SignedOut(props: {
  email: string
  password: string
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  busy: boolean
  error: string | null
  notice: string | null
  onSignIn: () => void
  onSignUp: () => void
}) {
  return (
    <>
      <Title>Sign in to sync</Title>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        Your local progress stays on this device. Sign in to back it up and play
        across devices.
      </p>
      <Field label="Email" type="email" value={props.email} onChange={props.setEmail} autoComplete="email" />
      <Field
        label="Password"
        type="password"
        value={props.password}
        onChange={props.setPassword}
        autoComplete="current-password"
      />
      {props.error && (
        <p className="text-xs" style={{ color: 'var(--bad)' }}>
          {props.error}
        </p>
      )}
      {props.notice && (
        <p className="text-xs" style={{ color: 'var(--good)' }}>
          {props.notice}
        </p>
      )}
      <PrimaryButton disabled={props.busy || !props.email || !props.password} onClick={props.onSignIn}>
        {props.busy ? 'Working…' : 'Log in'}
      </PrimaryButton>
      <SecondaryButton disabled={props.busy || !props.email || !props.password} onClick={props.onSignUp}>
        Create account
      </SecondaryButton>
    </>
  )
}

function SignedIn(props: {
  email: string | null
  status: string
  onSync: () => void
  onSignOut: () => void
  onClose: () => void
}) {
  const statusLabel =
    props.status === 'syncing'
      ? 'Syncing…'
      : props.status === 'synced'
        ? 'Synced'
        : props.status === 'error'
          ? 'Sync failed'
          : 'Local only'
  const statusColor =
    props.status === 'synced'
      ? 'var(--good)'
      : props.status === 'error'
        ? 'var(--bad)'
        : props.status === 'syncing'
          ? 'var(--accent)'
          : 'var(--text-faint)'
  return (
    <>
      <Title>Account</Title>
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{props.email ?? 'Signed in'}</span>
        <span className="text-xs" style={{ color: statusColor }}>
          ☁ {statusLabel}
        </span>
      </div>
      <PrimaryButton disabled={props.status === 'syncing'} onClick={props.onSync}>
        {props.status === 'syncing' ? 'Syncing…' : 'Sync now'}
      </PrimaryButton>
      <SecondaryButton onClick={props.onSignOut}>Log out</SecondaryButton>
      <SecondaryButton onClick={props.onClose}>Close</SecondaryButton>
    </>
  )
}

function ConflictChooser(props: {
  local: SaveSummary
  cloud: SaveSummary
  busy: boolean
  onChoose: (c: 'local' | 'cloud') => void
}) {
  return (
    <>
      <Title>Which save do you want?</Title>
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
        We found progress both on this device and in your account. Pick one to
        keep — nothing is deleted until you choose.
      </p>
      <SaveOption
        heading="This device"
        summary={props.local}
        disabled={props.busy}
        onClick={() => props.onChoose('local')}
      />
      <SaveOption
        heading="Cloud save"
        summary={props.cloud}
        disabled={props.busy}
        onClick={() => props.onChoose('cloud')}
      />
    </>
  )
}

function SaveOption(props: {
  heading: string
  summary: SaveSummary
  disabled: boolean
  onClick: () => void
}) {
  const { summary } = props
  const when = summary.savedAt ? new Date(summary.savedAt).toLocaleString() : 'unknown time'
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="flex flex-col gap-0.5 rounded-xl p-3 text-left"
      style={{ minHeight: 'var(--tap-lg)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
        Use {props.heading}
      </span>
      <span className="tnum text-xs" style={{ color: 'var(--text-dim)' }}>
        {money(summary.cash)} cash · {money(summary.lifetime)} lifetime
      </span>
      <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
        saved {when}
      </span>
    </button>
  )
}

// ---- shared controls ----

function Field(props: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
      {props.label}
      <input
        type={props.type}
        value={props.value}
        autoComplete={props.autoComplete}
        onChange={(e) => props.onChange(e.target.value)}
        className="rounded-xl px-3 text-sm"
        style={{
          minHeight: 'var(--tap)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />
    </label>
  )
}

function PrimaryButton(props: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-xl text-sm font-bold"
      style={{
        minHeight: 'var(--tap-lg)',
        background: props.disabled ? 'var(--surface-3)' : 'var(--accent)',
        color: props.disabled ? 'var(--text-faint)' : 'var(--accent-ink)',
      }}
    >
      {props.children}
    </button>
  )
}

function SecondaryButton(props: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className="rounded-xl text-sm font-semibold"
      style={{ minHeight: 'var(--tap)', background: 'var(--surface-3)', color: 'var(--text)' }}
    >
      {props.children}
    </button>
  )
}
