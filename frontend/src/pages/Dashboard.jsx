import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';

const SL = { todo:'To Do','in-progress':'In Progress',review:'Review',done:'Done' };
const SC = { todo:'var(--muted)','in-progress':'var(--blue)',review:'var(--purple)',done:'var(--teal)' };
const PC = { low:'var(--teal)',medium:'var(--blue)',high:'var(--amber)',critical:'var(--red)' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(()=>{
    taskService.getDashboardStats()
      .then(r=>{ setStats(r.data.stats); setRecent(r.data.recentTasks||[]); })
      .catch(()=>setErr('Failed to load dashboard'))
      .finally(()=>setLoading(false));
  },[]);

  if(loading) return (
    <div className="pg-loading"><div className="spinner-ring spinner"/>Loading dashboard…</div>
  );
  if(err) return <div className="alert alert-err">{err}</div>;

  const sb    = stats?.statusBreakdown||{};
  const total = stats?.totalTasks||0;
  const done  = sb.done||0;
  const pct   = total ? Math.round((done/total)*100) : 0;

  return (
    <div>
      <div className="pg-header">
        <div>
          <h1 className="pg-title">
            Good {new Date().getHours()<12?'morning':'afternoon'},{' '}
            <span style={{color:'var(--lime)'}}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="pg-sub">Here's your command center overview.</p>
        </div>
        <div className="pg-actions">
          <Link to="/projects" className="btn btn-outline btn-sm">All Projects →</Link>
          <Link to="/tasks"    className="btn btn-lime   btn-sm">My Tasks →</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid stagger">
        {[
          {label:'Projects',    val:stats?.totalProjects, glow:'var(--lime)',   c:'var(--lime)' },
          {label:'Total Tasks', val:stats?.totalTasks,    glow:'var(--blue)',   c:'var(--blue)' },
          {label:'Assigned',    val:stats?.myTasks,       glow:'var(--teal)',   c:'var(--teal)' },
          {label:'Overdue',     val:stats?.overdueTasks,  glow:'var(--red)',    c:'var(--red)'  },
        ].map(s=>(
          <div key={s.label} className="stat-card fade-up">
            <div className="stat-card-glow" style={{background:s.glow}}/>
            <div className="stat-num" style={{color:s.c}}>{s.val??0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress + Breakdown */}
      <div className="dash-grid gap-bot">
        <div className="card fade-up">
          <div className="card-head"><div className="card-title">Completion Rate</div></div>
          <div className="card-body">
            <div className="prog-ring-wrap">
              <div className="prog-ring-num">{pct}<span style={{fontSize:20,color:'var(--muted)'}}>%</span></div>
              <div style={{width:'100%'}}>
                <div className="prog-bar"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
                <div className="prog-bar-label">{done} of {total} tasks completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card fade-up">
          <div className="card-head"><div className="card-title">By Status</div></div>
          <div className="card-body">
            <div className="status-rows">
              {Object.entries(SL).map(([k,l])=>{
                const c = sb[k]||0;
                const w = total ? (c/total)*100 : 0;
                return (
                  <div key={k} className="status-row">
                    <span className={`chip chip-${k}`}>{l}</span>
                    <span className="status-count">{c}</span>
                    <div className="mini-bar">
                      <div className="mini-fill" style={{width:`${w}%`,background:SC[k]}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card fade-up">
        <div className="card-head">
          <div className="card-title">Recent Tasks</div>
          <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length===0 ? (
          <div className="empty">
            <div className="empty-icon">✦</div>
            <h3>No tasks yet</h3>
            <p>Create a project and start adding tasks to see them here.</p>
          </div>
        ) : (
          <div className="t-wrap" style={{borderRadius:'0 0 var(--r-lg) var(--r-lg)',border:'none',borderTop:'1px solid var(--border)'}}>
            <table className="t">
              <thead>
                <tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th><th>Assignee</th></tr>
              </thead>
              <tbody>
                {recent.map(task=>(
                  <tr key={task._id}>
                    <td className="t-cell-main">{task.title}</td>
                    <td>
                      {task.project
                        ? <Link to={`/projects/${task.project._id}`} className="link-a">{task.project.name}</Link>
                        : <span className="t-muted">—</span>}
                    </td>
                    <td>
                      <span style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                        <span className="pdot" style={{background:PC[task.priority]}}/>
                        <span className="mono" style={{fontSize:11}}>{task.priority}</span>
                      </span>
                    </td>
                    <td><span className={`chip chip-${task.status}`}>{SL[task.status]}</span></td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{task.assignedTo?.name||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
