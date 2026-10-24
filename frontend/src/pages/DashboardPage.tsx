import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProjects, createProject, updateProject, deleteProject } from '../api/projects'
import type { Project } from '../types'
import { getApiErrorMessage } from '../api/client'
import { ErrorBanner, EmptyState } from '../components/ErrorBanner'
import { LoadingSpinner, ProjectCardSkeleton } from '../components/LoadingSpinner'
import { Button, Input, Label, Textarea, Card, Badge, Modal, Select } from '../components/ui'
import { formatDate, relativeTime } from '../lib/utils'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{message:string; details?: any} | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt'|'updatedAt'|'title'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [formErrors, setFormErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null)

  const limit = 9

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, sortBy, sortOrder])

  const fetchProjects = async () => {
    setLoading(true); setError(null)
    try {
      const res = await listProjects({ page, limit, search: debouncedSearch || undefined, sortBy, sortOrder })
      setProjects(res.data); setPagination(res.pagination)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [page, debouncedSearch, sortBy, sortOrder])

  const resetForm = () => { setForm({ title: '', description: '' }); setFormErrors({}); }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormErrors({ title: 'Title is required' }); return }
    setSubmitting(true)
    try {
      await createProject({ title: form.title.trim(), description: form.description.trim() || null })
      setShowCreate(false); resetForm(); fetchProjects()
    } catch (e) {
      const err = getApiErrorMessage(e)
      setFormErrors({ submit: err.message })
      if (err.details) err.details.forEach((d:any)=> setFormErrors(prev=> ({...prev, [d.field]: d.message})))
    } finally { setSubmitting(false) }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (!form.title.trim()) { setFormErrors({ title: 'Title is required'}); return }
    setSubmitting(true)
    try {
      await updateProject(editing.id, { title: form.title.trim(), description: form.description.trim() ? form.description.trim() : null })
      setEditing(null); resetForm(); fetchProjects()
    } catch (e) {
      const err = getApiErrorMessage(e); setFormErrors({ submit: err.message })
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSubmitting(true)
    try {
      await deleteProject(deleteConfirm.id)
      setDeleteConfirm(null); fetchProjects()
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally { setSubmitting(false) }
  }

  const openEdit = (p: Project) => {
    setEditing(p); setForm({ title: p.title, description: p.description || '' }); setFormErrors({})
  }

  // Stats derived
  const totalProjects = pagination?.total ?? projects.length
  const stats = [
    { label: 'Total projects', value: totalProjects, sub: 'Across your workspace', icon: '◧', color: 'bg-indigo-600' },
    { label: 'Active tasks', value: projects.reduce((s,p)=> s + (p.taskCount||0), 0), sub: 'Open assignments', icon: '✓', color: 'bg-emerald-600' },
    { label: 'Recent', value: projects.length, sub: 'On this page', icon: '◷', color: 'bg-amber-500' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your projects and track progress in one place.</p>
        </div>
        <Button onClick={()=>{resetForm(); setShowCreate(true)}} size="lg">+ New project</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{loading ? '—' : s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl grid place-items-center text-white text-sm ${s.color}`}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects by title or description..." className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-auto">
              <option value="createdAt">Newest</option>
              <option value="updatedAt">Recently updated</option>
              <option value="title">Title A–Z</option>
            </Select>
            <Select value={sortOrder} onChange={e=>setSortOrder(e.target.value as any)} className="w-auto">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {pagination && <span>{pagination.total} project{pagination.total!==1?'s':''} • Page {pagination.page} of {pagination.totalPages || 1}</span>}
          <button onClick={fetchProjects} className="rounded-md border px-2 py-1 hover:bg-slate-50">↻ Refresh</button>
        </div>
      </Card>

      {/* Error */}
      {error && <ErrorBanner message={error.message} details={error.details} onRetry={fetchProjects} />}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProjectCardSkeleton /><ProjectCardSkeleton /><ProjectCardSkeleton />
          <ProjectCardSkeleton /><ProjectCardSkeleton /><ProjectCardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon="📁" title={debouncedSearch ? 'No matching projects' : 'No projects yet'} description={debouncedSearch ? `No results for “${debouncedSearch}”. Try a different search.` : 'Create your first project to start organizing tasks and collaborating with your team.'} action={!debouncedSearch && <Button onClick={()=>{resetForm(); setShowCreate(true)}}>+ Create project</Button>} />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="group">
                <Card hover className="p-5 h-full flex flex-col group-hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white text-sm font-semibold">{p.title[0]?.toUpperCase()}</div>
                    <div className="flex gap-1">
                      <button onClick={(e)=>{e.preventDefault(); openEdit(p)}} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700">✎</button>
                      <button onClick={(e)=>{e.preventDefault(); setDeleteConfirm(p)}} className="h-7 w-7 grid place-items-center rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600">🗑</button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold line-clamp-1 group-hover:text-indigo-600">{p.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mt-1">{p.description || <span className="italic text-slate-400">No description</span>}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="indigo">{p.taskCount} task{p.taskCount!==1?'s':''}</Badge>
                    <span className="text-xs text-slate-400">{relativeTime(p.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-slate-500">Updated {formatDate(p.updatedAt)}</span>
                    <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition">View →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={!pagination.hasPreviousPage} onClick={()=>setPage(p=>p-1)}>Previous</Button>
              <span className="text-sm text-slate-600 px-3">Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create new project" description="Projects help you organize related tasks and collaborate.">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><Label required>Project title</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="e.g. Website Redesign" maxLength={120} error={formErrors.title} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="What is this project about?" rows={4} maxLength={5000} /></div>
          {formErrors.submit && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formErrors.submit}</p>}
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button><Button type="submit" loading={submitting}>Create project</Button></div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={()=>setEditing(null)} title="Edit project" description="Changes are saved immediately.">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div><Label required>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} maxLength={120} error={formErrors.title} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={4} /></div>
          {formErrors.submit && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formErrors.submit}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancel</Button><Button type="submit" loading={submitting}>Save changes</Button></div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} title="Delete project?" description="This will permanently delete the project and all its tasks. This cannot be undone.">
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">You are about to delete <span className="font-semibold">“{deleteConfirm?.title}”</span>.</div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={submitting}>Delete project</Button></div>
        </div>
      </Modal>
    </div>
  )
}
