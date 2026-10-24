export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateForInput(dateStr: string | null) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

export function relativeTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr) ?? ''
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'TODO': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export function getStatusDot(status: string) {
  switch(status) {
    case 'TODO': return 'bg-slate-400'
    case 'IN_PROGRESS': return 'bg-amber-500'
    case 'COMPLETED': return 'bg-emerald-500'
    default: return 'bg-slate-400'
  }
}
