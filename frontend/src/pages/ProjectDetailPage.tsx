import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject } from '../api/projects'
import { listProjectTasks, createProjectTask, updateTask, deleteTask } from '../api/tasks'
import type { Project, Task } from '../types'
import { getApiErrorMessage } from '../api/client'
import { ErrorBanner, EmptyState } from '../components/ErrorBanner'
import { LoadingSpinner, TaskSkeleton } from '../components/LoadingSpinner'
import { Button, Input, Label, Textarea, Card, Badge, Modal, Select } from '../components/ui'
import { formatDate, getStatusColor, getStatusDot } from '../lib/utils'

const statusLabels: Record<string,string> = { TODO: 'To do', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' }
const statusColumns: Array<{key: Task['status']; label: string; icon: string}> = [
  { key: 'TODO', label: 'To Do', icon: '○' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: '◐' },
  { key: 'COMPLETED', label: 'Completed', icon: '●' },
]

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [error, setError] = useState<{message:string; details?: any} | null>(null)
  const [taskError, setTaskError] = useState<{message:string; details?: any} | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt'|'updatedAt'|'dueDate'|'title'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'board'|'list'>('board')

  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: '', description: '', status: 'TODO' as Task['status'], dueDate: '', assignedTo: '' })
  const [formErrors, setFormErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<Task | null>(null)

  useEffect(() => {
    const t = setTimeout(()=>setDebouncedSearch(search), 350)
    return ()=>clearTimeout(t)
  }, [search])
  useEffect(()=> setPage(1), [debouncedSearch, statusFilter, sortBy, sortOrder])

  const fetchProject = async () => {
    if (!projectId) return
    setLoadingProject(true); setError(null)
    try { setProject(await getProject(projectId)) } catch (e) { setError(getApiErrorMessage(e)) } finally { setLoadingProject(false) }
  }
  const fetchTasks = async () => {
    if (!projectId) return
    setLoadingTasks(true); setTaskError(null)
    try {
      const params: any = { page, limit: 20, sortBy, sortOrder }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await listProjectTasks(projectId, params)
      setTasks(res.data); setPagination(res.pagination)
    } catch (e) { setTaskError(getApiErrorMessage(e)) } finally { setLoadingTasks(false) }
  }

  useEffect(()=>{ fetchProject() }, [projectId])
  useEffect(()=>{ fetchTasks() }, [projectId, page, debouncedSearch, statusFilter, sortBy, sortOrder])

  const resetForm = () => { setForm({ title: '', description: '', status: 'TODO', dueDate: '', assignedTo: '' }); setFormErrors({}) }

  const validateForm = () => {
    const errs: Record<string,string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.length > 200) errs.title = 'Title must be at most 200 characters'
    if (form.assignedTo && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(form.assignedTo)) errs.assignedTo = 'Must be a valid UUID'
    return errs
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validateForm(); if (Object.keys(v).length) { setFormErrors(v); return }
    if (!projectId) return
    setSubmitting(true); setFormErrors({})
    try {
      await createProjectTask(projectId, { title: form.title.trim(), description: form.description.trim() || null, status: form.status, dueDate: form.dueDate || null, assignedTo: form.assignedTo || null })
      setShowCreate(false); resetForm(); fetchTasks(); fetchProject()
    } catch (e) {
      const err = getApiErrorMessage(e); setFormErrors({ submit: err.message })
      if (err.details) err.details.forEach((d:any)=> setFormErrors(p=>({...p, [d.field]: d.message})))
    } finally { setSubmitting(false) }
  }

  const openEditTask = (t: Task) => {
    setEditingTask(t)
    setForm({ title: t.title, description: t.description || '', status: t.status, dueDate: t.dueDate ? t.dueDate.slice(0,10) : '', assignedTo: t.assignedTo || '' })
    setFormErrors({})
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    const v = validateForm(); if (Object.keys(v).length) { setFormErrors(v); return }
    setSubmitting(true)
    try {
      await updateTask(editingTask.id, { title: form.title.trim(), description: form.description.trim() ? form.description.trim() : null, status: form.status, dueDate: form.dueDate ? form.dueDate : null, assignedTo: form.assignedTo || null })
      setEditingTask(null); resetForm(); fetchTasks()
    } catch (e) { setFormErrors({ submit: getApiErrorMessage(e).message }) } finally { setSubmitting(false) }
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskConfirm) return
    setSubmitting(true)
    try { await deleteTask(deleteTaskConfirm.id); setDeleteTaskConfirm(null); fetchTasks(); fetchProject() } catch(e){ setTaskError(getApiErrorMessage(e)) } finally{ setSubmitting(false) }
  }

  const moveStatus = async (task: Task, newStatus: Task['status']) => {
    try { await updateTask(task.id, { status: newStatus }); fetchTasks() } catch (e) { setTaskError(getApiErrorMessage(e)) }
  }

  if (loadingProject) return <div className="p-8"><LoadingSpinner label="Loading project..." /></div>
  if (error || !project) return <div className="p-6 max-w-3xl mx-auto"><ErrorBanner title="Project not found" message={error?.message || 'This project may have been deleted or you don’t have access.'} onRetry={fetchProject} /><Link to="/dashboard" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">← Back to dashboard</Link></div>

  const grouped = statusColumns.map(col => ({ ...col, tasks: tasks.filter(t => t.status === col.key) }))
  const counts = { TODO: grouped[0].tasks.length, IN_PROGRESS: grouped[1].tasks.length, COMPLETED: grouped[2].tasks.length }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-700">Projects</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{project.title}</span>
      </div>

      {/* Project header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 grid place-items-center text-white font-bold shrink-0">{project.title[0]?.toUpperCase()}</div>
            <div>
              <h1 className="text-lg font-bold">{project.title}</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">{project.description || <span className="italic">No description — add context for your team.</span>}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="indigo">{project.taskCount} tasks total</Badge>
                <span className="text-xs text-slate-400">Created {formatDate(project.createdAt)} • Updated {formatDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTasks}>↻ Refresh</Button>
            <Button onClick={()=>{resetForm(); setShowCreate(true)}}>+ New task</Button>
          </div>
        </div>
      </Card>

      {/* Task toolbar */}
      <Card className="p-4 flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..." className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-auto">
            <option value="all">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-auto hidden sm:block">
            <option value="createdAt">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="title">Title</option>
            <option value="updatedAt">Updated</option>
          </Select>
          <Select value={sortOrder} onChange={e=>setSortOrder(e.target.value as any)} className="w-auto hidden sm:block">
            <option value="desc">Desc</option><option value="asc">Asc</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={()=>setViewMode('board')} className={`px-3 py-1.5 text-xs font-medium ${viewMode==='board' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}>Board</button>
            <button onClick={()=>setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium border-l ${viewMode==='list' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}>List</button>
          </div>
          <span className="text-xs text-slate-500 hidden lg:block">{pagination ? `${pagination.total} tasks` : ''}</span>
        </div>
      </Card>

      {taskError && <ErrorBanner message={taskError.message} details={taskError.details} onRetry={fetchTasks} />}

      {/* Task views */}
      {loadingTasks ? (
        <div className={viewMode==='board' ? 'grid gap-4 lg:grid-cols-3' : 'space-y-3'}>
          <TaskSkeleton /><TaskSkeleton /><TaskSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✓" title={debouncedSearch || statusFilter!=='all' ? 'No tasks match your filters' : 'No tasks yet'} description={debouncedSearch || statusFilter!=='all' ? 'Try adjusting your search or status filter.' : 'Break your project into actionable tasks and track them to completion.'} action={<Button onClick={()=>{resetForm(); setShowCreate(true)}}>+ Create your first task</Button>} />
      ) : viewMode === 'board' ? (
        <div className="grid gap-4 lg:grid-cols-3 items-start">
          {grouped.map(col => (
            <div key={col.key} className="rounded-xl bg-slate-100 p-3 min-h-[300px]">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getStatusDot(col.key)}`} />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge className="bg-white">{col.tasks.length}</Badge>
                </div>
                {col.key === 'TODO' && <button onClick={()=>{resetForm(); setForm(f=>({...f, status: 'TODO'})); setShowCreate(true)}} className="text-xs text-slate-500 hover:text-slate-700">+ Add</button>}
              </div>
              <div className="mt-2 space-y-3 min-h-[200px]">
                {col.tasks.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white/60 p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                    <p className="text-xs text-slate-400 mt-1">Tasks in {col.label.toLowerCase()} will appear here</p>
                  </div>
                ) : col.tasks.map(task => (
                  <Card key={task.id} className="p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusColor(task.status)}`}>{statusLabels[task.status]}</span>
                      <div className="flex gap-1">
                        <button onClick={()=>openEditTask(task)} className="h-6 w-6 grid place-items-center rounded hover:bg-slate-100 text-slate-400">✎</button>
                        <button onClick={()=>setDeleteTaskConfirm(task)} className="h-6 w-6 grid place-items-center rounded hover:bg-red-50 text-slate-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                    <h4 className="mt-2 font-medium text-sm leading-snug line-clamp-2">{task.title}</h4>
                    {task.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.dueDate && <span className={`text-xs px-2 py-1 rounded-full border ${new Date(task.dueDate) < new Date() && task.status!=='COMPLETED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>📅 {formatDate(task.dueDate)}</span>}
                      {task.assignee && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full">👤 {task.assignee.name}</span>}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {col.key !== 'TODO' && <button onClick={()=>moveStatus(task,'TODO')} className="text-xs border rounded px-2 py-1 hover:bg-slate-50">← To Do</button>}
                      {col.key !== 'IN_PROGRESS' && <button onClick={()=>moveStatus(task,'IN_PROGRESS')} className="text-xs border rounded px-2 py-1 hover:bg-amber-50">↻ In Progress</button>}
                      {col.key !== 'COMPLETED' && <button onClick={()=>moveStatus(task,'COMPLETED')} className="text-xs border rounded px-2 py-1 hover:bg-emerald-50">✓ Done</button>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Created {formatDate(task.createdAt)}</p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                <span className={`h-2 w-2 rounded-full shrink-0 ${getStatusDot(task.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 truncate">{task.description || '—'}</p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Badge variant={task.status==='COMPLETED'?'success': task.status==='IN_PROGRESS'?'warning':'default'}>{statusLabels[task.status]}</Badge>
                  {task.dueDate && <span className="text-xs text-slate-500">{formatDate(task.dueDate)}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={()=>openEditTask(task)} className="rounded-md border px-2 py-1 text-xs hover:bg-white">Edit</button>
                  <button onClick={()=>setDeleteTaskConfirm(task)} className="rounded-md border px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && viewMode==='list' && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!pagination.hasPreviousPage} onClick={()=>setPage(p=>p-1)}>Previous</Button>
          <span className="text-sm px-3 py-1">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</Button>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Create task" description={`Add a task to ${project.title}`}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div><Label required>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Design the dashboard" maxLength={200} error={formErrors.title} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Include details, acceptance criteria..." rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></Select></div>
            <div><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} /></div>
          </div>
          <div><Label>Assignee ID <span className="text-xs text-slate-400">(optional UUID)</span></Label><Input value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})} placeholder="Leave empty to unassign" error={formErrors.assignedTo} /></div>
          {formErrors.submit && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formErrors.submit}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button><Button type="submit" loading={submitting}>Create task</Button></div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={()=>setEditingTask(null)} title="Edit task">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div><Label required>Title</Label><Input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} maxLength={200} error={formErrors.title} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></Select></div>
            <div><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} /></div>
          </div>
          <div><Label>Assignee ID</Label><Input value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})} placeholder="UUID or empty" error={formErrors.assignedTo} /></div>
          {formErrors.submit && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formErrors.submit}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setEditingTask(null)}>Cancel</Button><Button type="submit" loading={submitting}>Save</Button></div>
        </form>
      </Modal>

      {/* Delete task confirm */}
      <Modal open={!!deleteTaskConfirm} onClose={()=>setDeleteTaskConfirm(null)} title="Delete task?">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-medium">“{deleteTaskConfirm?.title}”</span>? This cannot be undone.</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setDeleteTaskConfirm(null)}>Cancel</Button><Button variant="danger" onClick={handleDeleteTask} loading={submitting}>Delete</Button></div>
        </div>
      </Modal>
    </div>
  )
}
