import React, { useState } from 'react';
import { X, Play, Clock, Shield, Database, Terminal, Settings, Cpu } from 'lucide-react';
import DataToolTip from '../../DataToolTip';
import WorkflowGraphModal from '../WorkflowGraphModal';
import './styles.scss';

const AgentTaskDetailsModal = ({ isOpen, onClose, task }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  if (!isOpen || !task) return null;

  const formatLastRun = (dateVal) => {
    if (!dateVal) return 'Never';
    let date;
    if (Array.isArray(dateVal)) {
      const [year, month, day, hour, minute, second] = dateVal;
      date = new Date(year, month - 1, day, hour, minute, second);
    } else {
      date = new Date(dateVal);
    }
    return isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
  };

  const getWorkflowSteps = () => {
    try {
      if (task.linqConfig?.query?.workflow) {
        return task.linqConfig.query.workflow;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const workflowSteps = getWorkflowSteps();

  return (
    <>
      <div className="modalOverlay" onClick={onClose}>
        <div className="modalContent taskDetailsModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="headerTop">
            <div className={`triggerBadge ${task.executionTrigger ? task.executionTrigger.toLowerCase() : 'manual'}`}>
              <span>{task.executionTrigger || 'MANUAL'}</span>
            </div>
            <div className={`statusLabel ${task.enabled ? 'enabled' : 'disabled'}`}>
              <span className="dot"></span>
              <span>{task.enabled ? 'Active Task' : 'Disabled'}</span>
            </div>
          </div>
          <h2>{task.name}</h2>
          <div className="taskTypeSubtitle">
            Linq Protocol task • {task.taskType || 'WORKFLOW_EMBEDDED'}
          </div>
        </div>

        <div className="modalTabs">
          <button 
            className={`tabButton ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {workflowSteps.length > 0 && (
            <button 
            className={`tabButton ${activeTab === 'workflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflow')}
          >
            Workflow Steps ({workflowSteps.length})
          </button>
          )}
          <button 
            className={`tabButton ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            Raw Configuration
          </button>
        </div>

        <div className="modalBody">
          {activeTab === 'overview' && (
            <div className="overviewTab">
              {task.description && (
                <div className="taskLongDesc">
                  <div className="sectionTitle">Task Description</div>
                  <div dangerouslySetInnerHTML={{ __html: task.description }} />
                </div>
              )}

              <div className="sectionTitle">Configuration Details</div>
              <div className="detailsGrid">
                <div className="detailCard">
                  <span className="label">Task ID</span>
                  <span className="value code">{task.id}</span>
                </div>
                <div className="detailCard">
                  <span className="label">Parent Agent ID</span>
                  <span className="value code">{task.agentId}</span>
                </div>
                <div className="detailCard">
                  <span className="label">Task Priority</span>
                  <DataToolTip text="Task Priority resolves execution conflicts when multiple tasks share identical schedules or triggers. Lower values represent higher precedence (e.g., P1 runs first, P5 is default).">
                    <span className="value" style={{ borderBottom: '1px dashed var(--border-color, #ccc)', cursor: 'help', display: 'inline-block' }}>
                      P{task.priority || 5}
                    </span>
                  </DataToolTip>
                </div>
                <div className="detailCard">
                  <span className="label">Timeout Limit</span>
                  <span className="value">{task.timeoutMinutes ? `${task.timeoutMinutes} minutes` : '30 minutes'}</span>
                </div>
                <div className="detailCard">
                  <span className="label">Max Retry Attempts</span>
                  <span className="value">{task.maxRetries ?? 3} retries</span>
                </div>
                <div className="detailCard">
                  <span className="label">Schedule Bootstrap</span>
                  <span className="value">{task.scheduleOnStartup ? 'Schedule on startup' : 'Manual start'}</span>
                </div>
                {task.cronExpression && (
                  <>
                    <div className="detailCard">
                      <span className="label">Cron Expression</span>
                      <span className="value code">{task.cronExpression}</span>
                    </div>
                    <div className="detailCard">
                      <span className="label">Schedule Description</span>
                      <span className="value">{task.cronDescription || 'Scheduled run'}</span>
                    </div>
                  </>
                )}
                <div className="detailCard">
                  <span className="label">Last Executed</span>
                  <span className="value">{formatLastRun(task.lastRun)}</span>
                </div>
                <div className="detailCard">
                  <span className="label">Next Execution</span>
                  <span className="value">{formatLastRun(task.nextRun)}</span>
                </div>
              </div>

              {(task.createdAt || task.updatedAt) && (
                <div className="auditSection">
                  <div className="sectionTitle">Audit Info</div>
                  <div className="auditGrid">
                    {task.createdAt && (
                      <div className="auditItem">
                        <span className="label">Created At</span>
                        <span className="value">{formatLastRun(task.createdAt)} {task.createdBy && `by ${task.createdBy}`}</span>
                      </div>
                    )}
                    {task.updatedAt && (
                      <div className="auditItem">
                        <span className="label">Last Updated</span>
                        <span className="value">{formatLastRun(task.updatedAt)} {task.updatedBy && `by ${task.updatedBy}`}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="workflowTab">
              <div className="workflowHeaderActions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button 
                  className="btnVisualGraph" 
                  onClick={() => setIsGraphOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Cpu size={16} />
                  View Visual Workflow Graph
                </button>
              </div>

              <div className="workflowTimeline">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="timelineStep">
                    <div className="stepNumberWrapper">
                      <div className="stepNumber">{step.step || (index + 1)}</div>
                    </div>
                    <div className="stepDetails">
                      <div className="stepTitleArea">
                        <h4>{step.summary || `Step ${step.step}`}</h4>
                        <div className="stepBadges">
                          <span className="badgeAction">{step.action?.toUpperCase() || 'EXECUTE'}</span>
                          <span className="badgeTarget">{step.target || 'SYSTEM'}</span>
                        </div>
                      </div>
                      <p className="stepDesc">{step.description}</p>
                      
                      {step.intent && (
                        <div className="stepEndpoint">
                          <span className="label">Action Intent: </span>
                          <span className="value code">{step.intent}</span>
                        </div>
                      )}

                      {step.payload && (
                        <div className="stepPayload">
                          <div className="payloadTitle">Payload Template</div>
                          <pre className="codeBox">
                            {typeof step.payload === 'object' 
                              ? JSON.stringify(step.payload, null, 2) 
                              : String(step.payload)}
                          </pre>
                        </div>
                      )}

                      {step.llmConfig && (
                        <div className="stepLlmConfig">
                          <div className="payloadTitle">AI LLM Model Config ({step.llmConfig.model})</div>
                          <pre className="codeBox">
                            {JSON.stringify(step.llmConfig.settings, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.jump && (
                        <div className="stepJump">
                          <span className="jumpLabel">Workflow Jump Condition: </span>
                          <span className="value code">{step.jump.condition} &rarr; Step {step.jump.targetStep} ({step.jump.conditionDesc})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="jsonTab">
              <div className="jsonHeader">
                <span>Task Settings Configuration Model</span>
              </div>
              <pre className="codeBox fullCodeBox">
                {JSON.stringify(task, null, 2)}
              </pre>
            </div>
          )}
        </div>
        </div>
      </div>

      <WorkflowGraphModal 
        show={isGraphOpen}
        onHide={() => setIsGraphOpen(false)}
        workflowData={task.linqConfig}
        agentTask={task}
      />
    </>
  );
};

export default AgentTaskDetailsModal;
