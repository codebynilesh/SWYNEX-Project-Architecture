import { useState } from 'react'

interface Props {
  title?: string
  message: string
  details?: Array<{ field: string; message: string }>
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
}

export function ErrorBanner({ title = 'Something went wrong', message, details, onRetry, onDismiss, variant = 'error' }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const variantStyles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }[variant]

  const icon = variant === 'error' ? '⚠️' : variant === 'warning' ? '⚡' : 'ℹ️'

  return (
    <div className={`rounded-lg border p-4 ${variantStyles}`} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="text-lg leading-none mt-0.5">{icon}</span>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="text-sm opacity-90">{message}</p>
            {details && details.length > 0 && (
              <div className="pt-2">
                <button onClick={() => setCollapsed(!collapsed)} className="text-xs font-medium underline hover:no-underline">
                  {collapsed ? 'Show details' : `Hide details (${details.length})`}
                </button>
                {!collapsed && (
                  <ul className="mt-2 space-y-1 rounded bg-white/60 p-2">
                    {details.map((d, i) => (
                      <li key={i} className="text-xs"><span className="font-medium">{d.field}:</span> {d.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onRetry && (
            <button onClick={onRetry} className="rounded-md bg-white px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 text-slate-700">
              Retry
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-500 hover:text-slate-700 p-1" aria-label="Dismiss">×</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: React.ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return <p className="text-xs text-red-600 mt-1">{message}</p>
}
