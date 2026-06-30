export function Placeholder({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-4xl">{icon}</span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {body}
      </p>
    </div>
  )
}
