import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Newspaper, Clock, Activity } from 'lucide-react';
import axiosInstance from '../../services/axiosInstance';
import AgentTaskDetailsModal from '../../components/Modals/AgentTaskDetailsModal';
import WorkflowGraphModal from '../../components/Modals/WorkflowGraphModal';
import DataToolTip from '../../components/DataToolTip';
import './styles.scss';

const getAgentMeta = (name) => {
  const n = name.toLowerCase();
  if (n.includes('form')) {
    return {
      icon: <FileText size={24} className="agentIcon formIcon" />
    };
  }
  if (n.includes('newsroom')) {
    return {
      icon: <Newspaper size={24} className="agentIcon newsIcon" />
    };
  }
  return {
    icon: <Clock size={24} className="agentIcon clockIcon" />
  };
};

const formatLastRun = (dateVal) => {
  if (!dateVal) return 'Never';
  let date;
  if (Array.isArray(dateVal)) {
    const [year, month, day, hour, minute, second] = dateVal;
    date = new Date(year, month - 1, day, hour, minute, second);
  } else {
    date = new Date(dateVal);
  }
  
  if (isNaN(date.getTime())) return 'Never';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 0) return 'Just now';
  const interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " years ago";
  const months = Math.floor(seconds / 2592000);
  if (months >= 1) return months + " months ago";
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return days + " days ago";
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return hours + " hours ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 1) return minutes + " minutes ago";
  return "Just now";
};

const getAgentIntervals = (tasks) => {
  if (!tasks || tasks.length === 0) return ['Manual'];
  const activeTasks = tasks.filter(t => t.enabled);
  const cronTasks = activeTasks.filter(t => (t.cronDescription && t.cronDescription.trim()) || (t.cronExpression && t.cronExpression.trim()));
  if (cronTasks.length > 0) {
    const intervals = cronTasks.map(t => t.cronDescription || t.cronExpression);
    return Array.from(new Set(intervals));
  }
  return ['Manual'];
};

const getLatestLastRun = (tasks) => {
  if (!tasks || tasks.length === 0) return 'Never';
  let latest = null;
  for (const t of tasks) {
    if (t.lastRun) {
      let date;
      if (Array.isArray(t.lastRun)) {
        const [year, month, day, hour, minute, second] = t.lastRun;
        date = new Date(year, month - 1, day, hour, minute, second);
      } else {
        date = new Date(t.lastRun);
      }
      if (!isNaN(date.getTime())) {
        if (!latest || date > latest) {
          latest = date;
        }
      }
    }
  }
  return latest ? formatLastRun(latest) : 'Never';
};

const AIAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [graphTask, setGraphTask] = useState(null);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/ai-agents/list');
        setAgents(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to fetch AI agents information.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleRowClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="aiAgentsPage">
      <div className="pageHeader">
        <div className="headerContent">
          <div className="titleArea">
            <div className="badge">
              <Cpu size={14} />
              <span>Komunas Infrastructure</span>
            </div>
            <h1>AI Agents</h1>
            <p className="subtitle">
              Manage and monitor the autonomous intelligence agents powering your regulatory feeds.
            </p>
          </div>
        </div>
      </div>

      <div className="agentsContainer">
        {loading ? (
          <div className="agentsLoading">Loading infrastructure status...</div>
        ) : error ? (
          <div className="agentsError">{error}</div>
        ) : (
          <div className="agentsList">
            {agents.map(agent => {
              const meta = getAgentMeta(agent.name);
              const agentTasks = agent.tasks || [];
              const isEnabled = agent.enabled !== false;
              const intervals = getAgentIntervals(agentTasks);
              const lastRun = getLatestLastRun(agentTasks);
              
              return (
                <div className="agentRow" key={agent.id}>
                  <div className="agentHeader">
                    <div className="agentHeaderLeft">
                      <div className="iconWrapper">
                        {meta.icon}
                      </div>
                      <div className="agentTitleDesc">
                        <h2>{agent.name}</h2>
                        <div 
                          className="description"
                          dangerouslySetInnerHTML={{ __html: agent.description }}
                        />
                      </div>
                    </div>
                    
                    <div className="agentHeaderRight">
                      <div className="agentMetaGrid">
                        <div className="metaCell">
                          <span className="label">Agent ID</span>
                          <span className="value code">{agent.id}</span>
                        </div>
                        <div className="metaCell">
                          <span className="label">Intervals</span>
                          <div className="intervalBadges">
                            {intervals.map((inter, idx) => {
                              const isManual = inter.toLowerCase() === 'manual';
                              return (
                                <span 
                                  className={`intervalBadge ${isManual ? 'manual' : ''}`} 
                                  key={idx}
                                >
                                  {inter}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="metaCell">
                          <span className="label">Last Execution</span>
                          <span className="value">{lastRun}</span>
                        </div>
                      </div>
                      <div className={`statusBadge ${isEnabled ? 'active' : 'inactive'}`}>
                        <Activity size={14} />
                        <span>{isEnabled ? 'ACTIVE' : 'DISABLED'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="agentTasks">
                    <div className="tasksHeader">
                      <h3>Agent Tasks (Sub-Agents)</h3>
                      <span className="countBadge">{agentTasks.length} tasks configured</span>
                    </div>
                    
                    {agentTasks.length === 0 ? (
                      <div className="tasksEmpty">No sub-agent tasks active for this agent.</div>
                    ) : (
                      <div className="tasksTableWrapper">
                        <table className="tasksTable">
                          <thead>
                            <tr>
                              <th>Task Name & Description</th>
                              <th>Trigger</th>
                              <th>Schedule</th>
                              <th>Priority</th>
                              <th>Timeout</th>
                              <th>Retries</th>
                              <th>Last Run</th>
                              <th>Status</th>
                              <th>Flow Graph</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agentTasks.map((task) => (
                              <tr 
                                key={task.id} 
                                className={`taskRowClickable ${task.enabled ? 'taskRowActive' : 'taskRowDisabled'}`}
                                onClick={() => handleRowClick(task)}
                              >
                                <td>
                                  <div className="taskNameCol">
                                    <div className={`taskIndicator ${task.enabled ? 'active' : 'inactive'}`} />
                                    <div className="taskTextContent">
                                      <div className="taskNameText">{task.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`triggerBadge ${task.executionTrigger ? task.executionTrigger.toLowerCase() : 'manual'}`}>
                                    {task.executionTrigger || 'MANUAL'}
                                  </span>
                                </td>
                                <td>
                                  <span className="scheduleText">
                                    {task.cronDescription || task.cronExpression || '—'}
                                  </span>
                                </td>
                                <td>
                                  <DataToolTip text="Task Priority resolves execution conflicts when multiple tasks share identical schedules or triggers. Lower values represent higher precedence (e.g., P1 runs first, P5 is default).">
                                    <span className="priorityText" style={{ borderBottom: '1px dashed var(--border-color, #ccc)', cursor: 'help', display: 'inline-block' }}>
                                      P{task.priority}
                                    </span>
                                  </DataToolTip>
                                </td>
                                <td>
                                  <span className="timeoutText">{task.timeoutMinutes ? `${task.timeoutMinutes}m` : '—'}</span>
                                </td>
                                <td>
                                  <span className="retriesText">{task.maxRetries ?? 3} max</span>
                                </td>
                                <td>
                                  <span className="lastRunText">{formatLastRun(task.lastRun)}</span>
                                </td>
                                <td>
                                  <span className={`taskStatusLabel ${task.enabled ? 'enabled' : 'disabled'}`}>
                                    {task.enabled ? 'ENABLED' : 'DISABLED'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btnViewGraphRow"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGraphTask(task);
                                      setIsGraphOpen(true);
                                    }}
                                  >
                                    <Cpu size={12} />
                                    View Graph
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AgentTaskDetailsModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
        task={selectedTask}
      />

      <WorkflowGraphModal 
        show={isGraphOpen}
        onHide={() => { setIsGraphOpen(false); setGraphTask(null); }}
        workflowData={graphTask?.linqConfig}
        agentTask={graphTask}
      />
    </div>
  );
};

export default AIAgents;



