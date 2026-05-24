import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, CheckCircle } from 'lucide-react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './index.css';
import EvalDashboard from './EvalDashboard';

function App() {
  const [problem, setProblem] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const [iterations, setIterations] = useState(0);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [events, setEvents] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [finalProof, setFinalProof] = useState('');
  const [activeTab, setActiveTab] = useState('solver'); // 'solver' | 'eval'
  
  const eventSourceRef = useRef(null);
  const streamEndRef = useRef(null);

  // Auto-scroll the stream
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
    setIterations(0);
    setConsecutivePasses(0);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // Create POST request to start the process
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
        
        // Save the last partial line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('event: ')) {
            const eventType = line.replace('event: ', '').trim();
            // Look for next data line
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
        feedback: payload.feedback,
        sympy_feedback: payload.sympy_feedback,
        subgoals: payload.subgoals,
        status: payload.status,
        // full_update may contain extra fields like sympy_feedback or other diagnostics
        full_update: payload.full_update || payload,
      }]);
    } else if (type === 'done') {
      setStatus(payload.status);
      setIsRunning(false);
      if (payload.final_proof) {
        setFinalProof(payload.final_proof);
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

  return (
    <div className="app-container">
      <header>
        <h1>Math Olympiad Agent</h1>
        <p className="subtitle">Agentic Workflow with LangGraph for Rigorous Proofs</p>
      </header>

      <div className="tabs-container">
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

      {activeTab === 'eval' ? (
        <EvalDashboard />
      ) : (
        <>
          <div className="glass-panel input-section">
            <textarea
              placeholder="Enter a complex Math Olympiad problem here..."
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
            {/* Left Column: Thought Process Stream */}
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

            {/* Right Column: Final Output */}
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

export default App;
