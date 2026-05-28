import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, CheckCircle } from 'lucide-react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';
import EvalDashboard from './EvalDashboard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'rgba(15, 17, 21, 0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', backdropFilter: 'blur(8px)' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>X-Axis: {label}</p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#818cf8' }}>
          Y-Axis: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

function AppPlot() {
  const [problem, setProblem] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [iterations, setIterations] = useState(0);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [events, setEvents] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [finalProof, setFinalProof] = useState('');
  const [finalPlotData, setFinalPlotData] = useState('');
  const [activeTab, setActiveTab] = useState('solver');

  const [backendType, setBackendType] = useState(() => {
    return localStorage.getItem('backend_type') || 'hf';
  });

  const getBackendUrl = () => {
    if (backendType === 'local') return 'http://localhost:8000';
    return 'https://swapnanildatta-finalyear.hf.space';
  };

  useEffect(() => {
    localStorage.setItem('backend_type', backendType);
  }, [backendType]);
  
  const eventSourceRef = useRef(null);
  const streamEndRef = useRef(null);

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const handleSubmit = async () => {
    if (!problem.trim() || isRunning) return;

    setIsRunning(true);
    setStatus('running');
    setEvents([]);
    setFinalProof('');
    setFinalPlotData('');
    setIterations(0);
    setConsecutivePasses(0);

    try {
      const apiUrl = getBackendUrl();
      const response = await fetch(`${apiUrl}/api/prove/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, max_iterations: 10, required_passes: 1 }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('event: ')) {
            const eventType = line.replace('event: ', '').trim();
            const dataIndex = lines.indexOf(line) + 1;
            if (dataIndex < lines.length && lines[dataIndex].startsWith('data: ')) {
              const dataStr = lines[dataIndex].replace('data: ', '').trim();
              try {
                const payload = JSON.parse(dataStr);
                handleStreamEvent(eventType, payload);
              } catch (e) {
                console.error('Failed to parse event data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setStatus('error');
      setIsRunning(false);
    }
  };

  const handleStreamEvent = (type, payload) => {
    if (type === 'start') {
      setStatus('running');
    } else if (type === 'node_update') {
      setIterations(payload.iteration || 0);
      setConsecutivePasses(payload.consecutive_passes || 0);
      setStatus(payload.status || 'running');
      
      setEvents((prev) => [...prev, {
        id: Date.now() + Math.random(),
        node: payload.node,
        iteration: payload.iteration,
        proof_snippet: payload.proof_snippet,
        plot_data: payload.plot_data,
        feedback: payload.feedback,
        sympy_feedback: payload.sympy_feedback,
        subgoals: payload.subgoals,
        status: payload.status,
        full_update: payload.full_update || payload,
      }]);
    } else if (type === 'done') {
      setStatus(payload.status);
      setIsRunning(false);
      if (payload.final_proof) {
        setFinalProof(payload.final_proof);
      }
      if (payload.plot_data) {
        setFinalPlotData(payload.plot_data);
      }
    } else if (type === 'error') {
      setStatus('error');
      setIsRunning(false);
      console.error('Agent error:', payload.message);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const parsePlotData = (dataStr) => {
    try {
      const parsed = JSON.parse(dataStr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { return null; }
    return null;
  };

  const renderPlot = (plotDataStr) => {
    const data = parsePlotData(plotDataStr);
    if (!data) return null;
    return (
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', animation: 'slideIn 0.5s ease-out' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '1rem', color: '#a78bfa' }}>✨ Function Visualization</h4>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="x" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="y" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorY)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header>
        <h1>Math Olympiad Agent <span style={{fontSize: '16px', color: '#f59e0b', verticalAlign: 'super'}}>Plot Edition</span></h1>
        <p className="subtitle">Agentic Workflow with LangGraph for Rigorous Proofs + Interactive Visualizations</p>
      </header>

      <div className="tabs-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn-tab ${activeTab === 'solver' ? 'active' : ''}`}
            onClick={() => setActiveTab('solver')}
          >
            🔍 Solver Workspace
          </button>
          <button 
            className={`btn-tab ${activeTab === 'eval' ? 'active' : ''}`}
            onClick={() => setActiveTab('eval')}
          >
            📊 Ablation Analytics
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 8px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '10px',
          backdropFilter: 'blur(12px)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>📡 Backend API:</span>
          <button 
            onClick={() => setBackendType('local')}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background: backendType === 'local' ? 'var(--accent-color)' : 'transparent',
              color: backendType === 'local' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Local (8000)
          </button>
          <button 
            onClick={() => setBackendType('hf')}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              background: backendType === 'hf' ? 'var(--success-color)' : 'transparent',
              color: backendType === 'hf' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Hugging Face
          </button>
        </div>
      </div>

      {activeTab === 'eval' ? (
        <EvalDashboard />
      ) : (
        <>
          <div className="glass-panel input-section">
            <textarea
              placeholder="Enter a complex Math Olympiad problem here... (e.g., 'Visualize the roots of x^2 - 4 = 0 and prove them.')"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              disabled={isRunning}
            />
            <button className="btn" onClick={handleSubmit} disabled={!problem.trim() || isRunning}>
              {isRunning ? <Loader2 className="spinner" size={20} /> : <Play size={20} />}
              {isRunning ? 'Proving...' : 'Generate Proof'}
            </button>

            {(status !== 'idle' || isRunning) && (
              <div className="status-bar">
                <div>
                  <span className="text-secondary mr-2">Status: </span>
                  <span className={`status-badge ${status}`}>
                    {status === 'running' ? 'Thinking' : status}
                  </span>
                </div>
                <div>
                  <span className="text-secondary mr-2">Iteration: </span>
                  <strong>{iterations}/10</strong>
                </div>
                <div>
                  <span className="text-secondary mr-2">Consecutive Passes: </span>
                  <strong>{consecutivePasses}/3</strong>
                </div>
              </div>
            )}
          </div>

          <div className="stream-container">
            <div className="glass-panel stream-col">
              <h3 className="mb-4 text-xl font-semibold">Thought Process</h3>
              {events.length === 0 && !isRunning && (
                <p className="text-secondary text-sm">Enter a problem to watch the agent's thought process.</p>
              )}
              
              {events.map((ev) => (
                <div key={ev.id} className="event-card">
                  <div className="event-header">
                    <span className={`node-name ${ev.node}`}>{ev.node.toUpperCase()} NODE</span>
                    <span>Iter: {ev.iteration}</span>
                  </div>
                  
                  {ev.node === 'generator' && ev.proof_snippet && (
                    <div className="math-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {ev.proof_snippet}
                      </ReactMarkdown>
                    </div>
                  )}

                  {ev.node === 'generator' && ev.plot_data && renderPlot(ev.plot_data)}
                  
                  {ev.node === 'verifier' && ev.feedback && (
                    <div className="feedback-content">
                      {ev.feedback}
                    </div>
                  )}
                  
                  {ev.node === 'verifier' && !ev.feedback && ev.status === 'running' && (
                    <div className="text-green-400 font-semibold mt-2">
                      <CheckCircle className="inline mr-1" size={16} /> Passed verification! (1/3)
                    </div>
                  )}

                  {ev.node === 'sympy_checker' && ev.sympy_feedback && (
                    <div className={`feedback-content sympy-feedback ${ev.status === 'sympy_failed' ? 'failed' : 'passed'}`}>
                      {ev.sympy_feedback}
                    </div>
                  )}

                  {ev.node === 'decomposer' && ev.subgoals && (
                    <div className="subgoals-content">
                      <h4 className="subgoals-title">Strategic Breakdown</h4>
                      <pre className="subgoals-pre">
                        {ev.subgoals}
                      </pre>
                    </div>
                  )}
                  <div className="mt-2">
                    <button className="btn small" onClick={() => toggleExpanded(ev.id)}>
                      {expandedIds.includes(ev.id) ? 'Hide full output' : 'View full output'}
                    </button>
                  </div>

                  {expandedIds.includes(ev.id) && (
                    <div className="full-output mt-2 p-2 bg-black/10 rounded">
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(ev.full_update || ev, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              <div ref={streamEndRef} />
            </div>

            <div className="glass-panel stream-col" style={{ minHeight: '400px' }}>
              <h3 className="mb-4 text-xl font-semibold">Final Proof</h3>
              {!finalProof && isRunning && (
                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                  <Loader2 className="spinner mb-2" size={32} />
                  <p>Waiting for convergence...</p>
                </div>
              )}
              
              {!finalProof && !isRunning && status === 'idle' && (
                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                  <p>No proof generated yet.</p>
                </div>
              )}
              
              {finalProof && (
                <div className="math-content final-result p-4 rounded-lg bg-black/20">
                  {finalPlotData && renderPlot(finalPlotData)}
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {finalProof}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AppPlot;
