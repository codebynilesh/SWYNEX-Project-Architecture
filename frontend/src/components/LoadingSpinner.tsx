type Props = { size?: 'sm' | 'md' | 'lg' | 'xl'; label?: string; fullPage?: boolean }

export function LoadingSpinner({ size = 'md', label, fullPage }: Props) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4',
  }[size]

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses} animate-spin rounded-full border-slate-200 border-t-indigo-600`} role="status" aria-label="Loading" />
      {label && <p className="text-sm text-slate-500 animate-pulse">{label}</p>}
    </div>
  )

  if (fullPage) {
    return <div className="flex min-h-[60vh] items-center justify-center">{spinner}</div>
  }
  return spinner
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TaskSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  )
}
