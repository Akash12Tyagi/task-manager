import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import Modal from '../components/common/Modal';

const PALETTE = ['#C8F135','#4D9EFF','#00E5AA','#FF3B55','#A855F7','#FFB000','#FF6B9D'];
const STATUS_C = { planning:'var(--muted)',active:'var(--teal)','on-hold':'var(--amber)',completed:'var(--dim)' };

function ProjCard({ project, onDelete, isAdmin }) {
  const tc    = project.taskCounts||{};
  const total = tc.total||0;
  const done  = tc.done||0;
  const pct   = total ? Math.round((done/total)*100) : 0;
  const col   = project.color||'#C8F135';

  return (
    <div className="proj-card fade-up">
      <div className="proj-card-stripe" style={{background:col}}/>
      <div className="proj-card-body">
        <div className="proj-card-top">
          <div>
            <span style={{fontFamily:'var(--font-mono)',fontSize:9,color:STATUS_C[project.status]||'var(--muted)',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>
              ● {project.status}
            </span>
          </div>
          {isAdmin && (
            <button className="btn btn-ghost btn-icon btn-xs"
              style={{color:'var(--red)',flexShrink:0}}
              onClick={e=>{e.preventDefault();onDelete(project._id);}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="proj-card-name">{project.name}</div>
        <div className="proj-card-desc">{project.description||'No description provided.'}</div>

        <div className="proj-card-progress">
          <div className="proj-prog-label">
            <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--muted)'}}>Progress</span>
            <span className="proj-prog-pct" style={{color:col}}>{pct}%</span>
          </div>
          <div className="prog-bar" style={{height:4}}>
            <div className="prog-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${col},${col}99)`}}/>
          </div>
          <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--dim)'}}>{done}/{total} tasks</span>
        </div>

        <div className="proj-card-footer">
          <div className="av-stack">
            {(project.members||[]).slice(0,4).map((m,i)=>(
              <div key={i} className="av" title={m.user?.name}
                style={{background:`${col}20`,color:col,borderColor:'var(--black-2)'}}>
                {m.user?.name?.[0]?.toUpperCase()||'?'}
              </div>
            ))}
            {(project.members?.length||0)>4 &&
              <div className="av av-more">+{project.members.length-4}</div>}
          </div>
          <Link to={`/projects/${project._id}`} className="btn btn-outline btn-sm">Open →</Link>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({name:'',description:'',status:'planning',priority:'medium',dueDate:'',color:PALETTE[0]});

  const load = useCallback(async()=>{
    try {
      const r = await projectService.getAll(search?{search}:{});
      setProjects(r.data.projects||[]);
    } catch { setErr('Failed to load projects'); }
    finally { setLoading(false); }
  },[search]);

  useEffect(()=>{ load(); },[load]);

  const handleCreate = async(e)=>{
    e.preventDefault(); setSaving(true);
    try {
      await projectService.create(form);
      setModal(false);
      setForm({name:'',description:'',status:'planning',priority:'medium',dueDate:'',color:PALETTE[0]});
      load();
    } catch(err){ setErr(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async(id)=>{
    if(!window.confirm('Delete this project and ALL tasks? This is permanent.')) return;
    try { await projectService.delete(id); setProjects(p=>p.filter(x=>x._id!==id)); }
    catch(err){ alert(err.message); }
  };

  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div>
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Projects</h1>
          <p className="pg-sub">{projects.length} project{projects.length!==1?'s':''} in your workspace</p>
        </div>
        <div className="pg-actions">
          <input className="input" style={{width:220}} placeholder="Search projects…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
          {isAdmin && (
            <button className="btn btn-lime" onClick={()=>setModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Project
            </button>
          )}
        </div>
      </div>

      {err && <div className="alert alert-err gap-bot">{err}</div>}

      {loading ? (
        <div className="pg-loading"><div className="spinner-ring spinner"/>Loading…</div>
      ) : projects.length===0 ? (
        <div className="empty">
          <div className="empty-icon">◫</div>
          <h3>No projects found</h3>
          <p>{isAdmin?'Create your first project to get started.':'Ask an admin to add you to a project.'}</p>
          {isAdmin && <button className="btn btn-lime" onClick={()=>setModal(true)}>Create Project</button>}
        </div>
      ) : (
        <div className="proj-grid stagger">{projects.map(p=>(
          <ProjCard key={p._id} project={p} onDelete={handleDelete} isAdmin={isAdmin}/>
        ))}</div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="New Project">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="field">
            <label className="field-label">Project Name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Website Redesign" required/>
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="input" value={form.description} onChange={set('description')} placeholder="What's this project about?" rows={3}/>
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Status</label>
              <select className="input input--select" value={form.status} onChange={set('status')}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Priority</label>
              <select className="input input--select" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')}/>
            </div>
            <div className="field">
              <label className="field-label">Project Color</label>
              <div className="color-row">
                {PALETTE.map(c=>(
                  <button key={c} type="button"
                    className={`color-swatch${form.color===c?' picked':''}`}
                    style={{background:c}}
                    onClick={()=>setForm(f=>({...f,color:c}))}/>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-lime" disabled={saving}>
              {saving ? <><div className="spinner-ring spinner"/>Creating…</> : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
