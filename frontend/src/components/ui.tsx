import { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'danger'|'outline'; size?: 'sm'|'md'|'lg'; loading?: boolean }) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm',
  }
  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-sm',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

export function Input({ className, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div className="w-full">
      <input className={cn('flex h-9 w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200', className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ className, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div className="w-full">
      <textarea className={cn('flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200', className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ className, children, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="w-full">
      <select className={cn('flex h-9 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-red-300':'border-slate-200', className)} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Label({ children, required, className, ...props }: { children: ReactNode; required?: boolean; className?: string } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-slate-700', className)} {...props}>{children}{required && <span className="text-red-500 ml-1">*</span>}</label>
}

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn('rounded-xl border bg-white shadow-sm', hover && 'hover:shadow-md hover:border-slate-300 transition-all', className)}>{children}</div>
}

export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: 'default'|'success'|'warning'|'danger'|'indigo'; className?: string }) {
  const variants: Record<string,string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>{children}</span>
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'sm'|'md'|'lg' }) {
  if (!open) return null
  const sizeCls = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizeCls} m-4 rounded-2xl bg-white shadow-xl animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
