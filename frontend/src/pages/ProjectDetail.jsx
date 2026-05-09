import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { authService } from '../services/authService';
import Modal from '../components/common/Modal';

const COLS = ['todo','in-progress','review','done'];
const CL   = { todo:'To Do','in-progress':'In Progress',review:'Review',done:'Done' };
const PC   = { low:'var(--teal)',medium:'var(--blue)',high:'var(--amber)',critical:'var(--red)' };

function TaskCard({ task, onStatus, onDelete, canDelete }) {
  const over = task.dueDate && new Date(task.dueDate)<new Date() && task.status!=='done';
  return (
    <div className={`tk-card${over?' tk-overdue':''}`}>
      <div className="tk-bar" style={{background:PC[task.priority]||'var(--border)'}}/>
      <div className="tk-body">
        <div className="tk-title">{task.title}</div>
        {task.description && <div className="tk-desc">{task.description}</div>}
        <div className="tk-meta">
          {task.dueDate && (
            <span className={`tk-due${over?' over':''}`}>
              {over?'⚠ ':''}{new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
            </span>
          )}
          {task.assignedTo && (
            <div className="tk-who" title={task.assignedTo.name}>
              {task.assignedTo.name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="tk-foot">
          <select className="status-sel" value={task.status} onChange={e=>onStatus(task._id,e.target.value)}>
            {COLS.map(s=><option key={s} value={s}>{CL[s]}</option>)}
          </select>
          {canDelete && (
            <button className="btn btn-danger btn-icon btn-xs" onClick={()=>onDelete(task._id)}
              style={{padding:'4px 6px',flexShrink:0}}>✕</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate  = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject]   = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [tab, setTab]           = useState('board');

  const [tModal, setTModal] = useState(false);
  const [mModal, setMModal] = useState(false);
  const [tForm, setTForm]   = useState({title:'',description:'',priority:'medium',dueDate:'',assignedTo:''});
  const [mEmail, setMEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async()=>{
    try {
      const [pR,tR] = await Promise.all([projectService.getById(id), taskService.getAll({project:id})]);
      setProject(pR.data.project); setTasks(tR.data.tasks||[]);
    } catch { setErr('Failed to load project'); }
    finally   { setLoading(false); }
  },[id]);

  useEffect(()=>{ load(); authService.getAllUsers().then(r=>setAllUsers(r.data.users||[])).catch(()=>{}); },[load]);

  const isPAdmin = isAdmin || project?.owner?._id===user?._id;

  const onStatus = async(tid,status)=>{
    try { await taskService.update(tid,{status}); setTasks(ts=>ts.map(t=>t._id===tid?{...t,status}:t)); }
    catch(e){ alert(e.message); }
  };
  const onDelete = async(tid)=>{
    if(!window.confirm('Delete task?')) return;
    try { await taskService.delete(tid); setTasks(ts=>ts.filter(t=>t._id!==tid)); }
    catch(e){ alert(e.message); }
  };
  const onCreateTask = async(e)=>{
    e.preventDefault(); setSaving(true);
    try {
      const r = await taskService.create({...tForm,project:id});
      setTasks(ts=>[r.data.task,...ts]); setTModal(false);
      setTForm({title:'',description:'',priority:'medium',dueDate:'',assignedTo:''});
    } catch(e){ alert(e.message); }
    finally { setSaving(false); }
  };
  const onAddMember = async(e)=>{
    e.preventDefault();
    const found = allUsers.find(u=>u.email===mEmail);
    if(!found){ alert('No user found with that email'); return; }
    setSaving(true);
    try { await projectService.addMember(id,found._id,'member'); await load(); setMModal(false); setMEmail(''); }
    catch(e){ alert(e.message); }
    finally { setSaving(false); }
  };
  const onRemMember = async(uid)=>{
    if(!window.confirm('Remove member?')) return;
    try { await projectService.removeMember(id,uid); await load(); }
    catch(e){ alert(e.message); }
  };

  if(loading) return <div className="pg-loading"><div className="spinner-ring spinner"/>Loading…</div>;
  if(err) return (
    <div>
      <div className="alert alert-err gap-bot">{err}</div>
      <button className="btn btn-outline btn-sm" onClick={()=>navigate('/projects')}>← Projects</button>
    </div>
  );
  if(!project) return null;

  const col  = project.color||'#C8F135';
  const byS  = COLS.reduce((a,s)=>({...a,[s]:tasks.filter(t=>t.status===s)}),{});

  return (
    <div>
      <div className="pg-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/projects')}
            style={{marginBottom:10,padding:'4px 0',border:'none',color:'var(--muted)',display:'flex',alignItems:'center',gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Projects
          </button>
          <h1 className="pg-title" style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:col,boxShadow:`0 0 12px ${col}60`,flexShrink:0}}/>
            {project.name}
          </h1>
          {project.description && <p className="pg-sub">{project.description}</p>}
        </div>
        <div className="pg-actions">
          {isPAdmin && (
            <button className="btn btn-outline btn-sm" onClick={()=>setMModal(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
              </svg>
              Members
            </button>
          )}
          <button className="btn btn-lime btn-sm" onClick={()=>setTModal(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Quick stats strip */}
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {COLS.map(s=>(
          <div key={s} style={{background:'var(--black-2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,minWidth:110}}>
            <span className={`chip chip-${s}`} style={{fontSize:9}}>{CL[s]}</span>
            <span style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700}}>{byS[s].length}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {['board','list','members'].map(t=>(
          <button key={t} className={`tab-btn${tab===t?' on':''}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Board */}
      {tab==='board' && (
        <div className="kanban stagger">
          {COLS.map(status=>(
            <div key={status} className="k-col fade-up">
              <div className="k-col-head">
                <span className="k-col-name">{CL[status]}</span>
                <span className="k-count">{byS[status].length}</span>
              </div>
              <div className="k-cards">
                {byS[status].length===0
                  ? <div className="k-empty">No tasks</div>
                  : byS[status].map(task=>(
                      <TaskCard key={task._id} task={task} onStatus={onStatus} onDelete={onDelete} canDelete={isPAdmin}/>
                    ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {tab==='list' && (
        tasks.length===0 ? (
          <div className="empty"><div className="empty-icon">✦</div><h3>No tasks yet</h3><p>Add your first task to get started.</p></div>
        ) : (
          <div className="t-wrap">
            <table className="t">
              <thead>
                <tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th>{isPAdmin&&<th></th>}</tr>
              </thead>
              <tbody>
                {tasks.map(task=>{
                  const over = task.dueDate && new Date(task.dueDate)<new Date() && task.status!=='done';
                  return (
                    <tr key={task._id} className={over?'t-overdue':''}>
                      <td className="t-cell-main">{task.title}</td>
                      <td>
                        <select className="status-sel" value={task.status}
                          onChange={e=>onStatus(task._id,e.target.value)}
                          style={{width:'auto'}}>
                          {COLS.map(s=><option key={s} value={s}>{CL[s]}</option>)}
                        </select>
                      </td>
                      <td style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}>
                        <span className="pdot" style={{background:PC[task.priority]}}/>
                        <span className="mono" style={{fontSize:11}}>{task.priority}</span>
                      </td>
                      <td style={{fontSize:12,color:'var(--muted)'}}>{task.assignedTo?.name||'—'}</td>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:11}} className={over?'t-danger':''}>
                        {task.dueDate?new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—'}
                      </td>
                      {isPAdmin&&<td><button className="btn btn-danger btn-xs" onClick={()=>onDelete(task._id)}>Delete</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Members */}
      {tab==='members' && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Team · {project.members?.length||0} members</div>
            {isPAdmin && <button className="btn btn-lime btn-sm" onClick={()=>setMModal(true)}>+ Add</button>}
          </div>
          <div className="card-body" style={{padding:'8px 16px'}}>
            <ul className="member-list">
              {(project.members||[]).map((m,i)=>(
                <li key={i} className="member-row">
                  <div className="av-lg">{m.user?.name?.[0]?.toUpperCase()||'?'}</div>
                  <div className="member-info">
                    <div className="member-name">{m.user?.name}</div>
                    <div className="member-email">{m.user?.email}</div>
                  </div>
                  <span className={`chip chip-${m.role}`}>{m.role?.toUpperCase()}</span>
                  {isPAdmin && m.user?._id!==project.owner?._id && (
                    <button className="btn btn-danger btn-xs" onClick={()=>onRemMember(m.user._id)}>Remove</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={tModal} onClose={()=>setTModal(false)} title="New Task">
        <form onSubmit={onCreateTask} className="modal-form">
          <div className="field">
            <label className="field-label">Title *</label>
            <input className="input" value={tForm.title} onChange={e=>setTForm(f=>({...f,title:e.target.value}))} placeholder="What needs to be done?" required/>
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="input" value={tForm.description} onChange={e=>setTForm(f=>({...f,description:e.target.value}))} placeholder="Details…" rows={3}/>
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Priority</label>
              <select className="input input--select" value={tForm.priority} onChange={e=>setTForm(f=>({...f,priority:e.target.value}))}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Due Date</label>
              <input className="input" type="date" value={tForm.dueDate} onChange={e=>setTForm(f=>({...f,dueDate:e.target.value}))}/>
            </div>
          </div>
          {isPAdmin && (
            <div className="field">
              <label className="field-label">Assign To</label>
              <select className="input input--select" value={tForm.assignedTo} onChange={e=>setTForm(f=>({...f,assignedTo:e.target.value}))}>
                <option value="">Unassigned</option>
                {(project.members||[]).map((m,i)=><option key={i} value={m.user?._id}>{m.user?.name}</option>)}
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={()=>setTModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>
              {saving?<><div className="spinner-ring spinner"/>Creating…</>:'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={mModal} onClose={()=>setMModal(false)} title="Add Member">
        <form onSubmit={onAddMember} className="modal-form">
          <div className="field">
            <label className="field-label">Member Email</label>
            <input className="input" type="email" value={mEmail} onChange={e=>setMEmail(e.target.value)} placeholder="user@company.com" required/>
            <div className="field-hint">The user must have an existing account.</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={()=>setMModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>
              {saving?<><div className="spinner-ring spinner"/>Adding…</>:'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
