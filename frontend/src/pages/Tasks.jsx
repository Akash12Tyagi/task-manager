import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../services/taskService';

const SL = { todo:'To Do','in-progress':'In Progress',review:'Review',done:'Done' };
const PC = { low:'var(--teal)',medium:'var(--blue)',high:'var(--amber)',critical:'var(--red)' };

export default function Tasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [f, setF]             = useState({status:'',priority:'',overdue:false,search:''});

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const p={};
      if(f.status)   p.status   = f.status;
      if(f.priority) p.priority = f.priority;
      if(f.overdue)  p.overdue  = 'true';
      if(f.search)   p.search   = f.search;
      const r = await taskService.getAll(p);
      setTasks(r.data.tasks||[]);
    } catch { setErr('Failed to load tasks'); }
    finally { setLoading(false); }
  },[f]);

  useEffect(()=>{ load(); },[load]);

  const onStatus = async(tid,status)=>{
    try { await taskService.update(tid,{status}); setTasks(ts=>ts.map(t=>t._id===tid?{...t,status}:t)); }
    catch(e){ alert(e.message); }
  };

  const upd=(k)=>(e)=>setF(x=>({...x,[k]:e.target.value}));

  return (
    <div>
      <div className="pg-header">
        <div>
          <h1 className="pg-title">All Tasks</h1>
          <p className="pg-sub">{tasks.length} task{tasks.length!==1?'s':''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input className="input filter-search" placeholder="Search tasks…" value={f.search} onChange={upd('search')}/>
        <select className="input input--select" style={{width:'auto'}} value={f.status} onChange={upd('status')}>
          <option value="">All Statuses</option>
          {Object.entries(SL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input input--select" style={{width:'auto'}} value={f.priority} onChange={upd('priority')}>
          <option value="">All Priorities</option>
          <option value="low">Low</option><option value="medium">Medium</option>
          <option value="high">High</option><option value="critical">Critical</option>
        </select>
        <label className="filter-check">
          <input type="checkbox" checked={f.overdue} onChange={e=>setF(x=>({...x,overdue:e.target.checked}))}/>
          Overdue only
        </label>
        <button className="btn btn-ghost btn-sm"
          onClick={()=>setF({status:'',priority:'',overdue:false,search:''})}>
          Clear
        </button>
      </div>

      {err && <div className="alert alert-err gap-bot">{err}</div>}

      {loading ? (
        <div className="pg-loading"><div className="spinner-ring spinner"/>Loading…</div>
      ) : tasks.length===0 ? (
        <div className="empty">
          <div className="empty-icon">✦</div>
          <h3>No tasks match</h3>
          <p>Try adjusting your filters, or create tasks inside a project.</p>
        </div>
      ) : (
        <div className="t-wrap">
          <table className="t">
            <thead>
              <tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Due Date</th></tr>
            </thead>
            <tbody>
              {tasks.map(task=>{
                const over = task.dueDate && new Date(task.dueDate)<new Date() && task.status!=='done';
                return (
                  <tr key={task._id} className={over?'t-overdue':''}>
                    <td className="t-cell-main">
                      {task.title}
                      {over && <span className="chip chip-critical ml-2">Overdue</span>}
                    </td>
                    <td>
                      {task.project
                        ? <Link to={`/projects/${task.project._id}`} className="link-a">{task.project.name}</Link>
                        : <span className="t-muted">—</span>}
                    </td>
                    <td style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                      <span className="pdot" style={{background:PC[task.priority]}}/>
                      <span className="mono" style={{fontSize:11}}>{task.priority}</span>
                    </td>
                    <td>
                      <select className="status-sel" value={task.status}
                        onChange={e=>onStatus(task._id,e.target.value)}
                        style={{width:'auto'}}>
                        {Object.entries(SL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      {task.assignedTo
                        ? <span style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                            <span className="av" style={{margin:0,width:22,height:22,fontSize:9}}>
                              {task.assignedTo.name[0].toUpperCase()}
                            </span>
                            {task.assignedTo.name}
                          </span>
                        : <span className="t-muted">—</span>}
                    </td>
                    <td style={{fontFamily:'var(--font-mono)',fontSize:11}} className={over?'t-danger':''}>
                      {task.dueDate?new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
