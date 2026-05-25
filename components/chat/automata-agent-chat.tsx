'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import dynamic from 'next/dynamic'
import {
  Play,
  Loader2,
  XCircle,
  GitMerge,
  BrainCircuit,
  ShieldCheck,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

// Dynamically import heavy visualization libraries (client-side only)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = 'idle' | 'running' | 'verified' | 'failed' | 'error'

interface NodeEvent {
  id: number
  node: 'problem_analyzer' | 'algorithm_engine' | 'automata_verifier'
  iteration: number
  solution_snippet?: string
  nfa_graph_data?: string
  dfa_graph_data?: string
  feedback?: string
  subgoals?: string
  status: AgentStatus
  full_update?: Record<string, unknown>
}

// ── Node config ───────────────────────────────────────────────────────────────
const NODE_CONFIG: Record<string, any> = {
  problem_analyzer: {
    label: 'Problem Analyzer',
    icon: BrainCircuit,
    color: 'oklch(0.7 0.15 220)',
    bg: 'oklch(0.7 0.15 220 / 0.12)',
    border: 'oklch(0.7 0.15 220 / 0.3)',
  },
  algorithm_engine: {
    label: 'Automata Engine',
    icon: GitMerge,
    color: 'oklch(0.8 0.18 85)',
    bg: 'oklch(0.8 0.18 85 / 0.12)',
    border: 'oklch(0.8 0.18 85 / 0.3)',
  },
  automata_verifier: {
    label: 'Logic Verifier',
    icon: ShieldCheck,
    color: 'oklch(0.78 0.18 55)',
    bg: 'oklch(0.78 0.18 55 / 0.12)',
    border: 'oklch(0.78 0.18 55 / 0.3)',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatText = (text: string | undefined) => {
  if (!text) return ''
  let formatted = text
  formatted = formatted.replace(/<subgoal\s+(\d+)>/gi, '\n### Step $1\n')
  formatted = formatted.replace(/<\/subgoal\s+\d+>/gi, '\n')
  return formatted.trim()
}

const parseGraphData = (dataStr: string | undefined) => {
  if (!dataStr) return null
  try {
    let clean = dataStr.trim()
    if (clean.startsWith('```json')) clean = clean.substring(7)
    if (clean.startsWith('```')) clean = clean.substring(3)
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3)
    
    const parsed = JSON.parse(clean.trim())
    if (parsed.nodes && parsed.links) return parsed
    return null
  } catch (err) { 
    console.error("Parse graph error:", err)
    return null 
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg: Record<AgentStatus, { label: string; cls: string }> = {
    idle:         { label: 'Ready',       cls: 'bg-white/5 text-white/40 border-white/10' },
    running:      { label: 'Computing…',  cls: 'bg-[oklch(0.8_0.18_85_/_0.15)] text-[oklch(0.8_0.18_85)] border-[oklch(0.8_0.18_85_/_0.3)] animate-pulse' },
    verified:     { label: 'Verified ✓',  cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)]' },
    failed:       { label: 'Failed',      cls: 'bg-[oklch(0.577_0.245_27_/_0.15)] text-[oklch(0.677_0.245_27)] border-[oklch(0.577_0.245_27_/_0.3)]' },
    error:        { label: 'Error',       cls: 'bg-[oklch(0.577_0.245_27_/_0.15)] text-[oklch(0.677_0.245_27)] border-[oklch(0.577_0.245_27_/_0.3)]' },
  }
  const { label, cls } = cfg[status]
  return (
    <span className={cn('text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase', cls)}>
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AutomataAgentChat() {
  const [problem, setProblem] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [iterations, setIterations] = useState(0)
  const [consecutivePasses, setConsecutivePasses] = useState(0)
  const [events, setEvents] = useState<NodeEvent[]>([])
  
  // Carousel State: 0 = NFA, 1 = DFA
  const [activeTab, setActiveTab] = useState<0 | 1>(0)
  
  const [finalSolution, setFinalSolution] = useState('')
  const [finalNfaData, setFinalNfaData] = useState('')
  const [finalDfaData, setFinalDfaData] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  
  // Graph sizing & physics
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<any>(null)
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!graphContainerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setGraphSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    observer.observe(graphContainerRef.current)
    return () => observer.disconnect()
  }, [])

  // Graph Physics Initialization
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400)
      fgRef.current.d3Force('link').distance(120)
      fgRef.current.d3ReheatSimulation()
    }
  }, [finalNfaData, finalDfaData, activeTab])

  const ACCENT = 'oklch(0.8 0.18 85)' // Automata Yellow/Orange

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const handleStreamEvent = useCallback((type: string, payload: Record<string, unknown>) => {
    if (type === 'start') {
      setStatus('running')
    } else if (type === 'node_update') {
      setIterations((payload.iteration as number) || 0)
      setConsecutivePasses((payload.consecutive_passes as number) || 0)
      setStatus((payload.status as AgentStatus) || 'running')
      
      const nodeEvent: NodeEvent = {
        id: Date.now() + Math.random(),
        node: payload.node as NodeEvent['node'],
        iteration: (payload.iteration as number) || 0,
        solution_snippet: payload.solution_snippet as string | undefined,
        nfa_graph_data: payload.nfa_graph_data as string | undefined,
        dfa_graph_data: payload.dfa_graph_data as string | undefined,
        feedback: payload.feedback as string | undefined,
        subgoals: payload.subgoals as string | undefined,
        status: (payload.status as AgentStatus) || 'running',
        full_update: payload.full_update as Record<string, unknown> | undefined,
      }
      setEvents(prev => [...prev, nodeEvent])

      // Live update main display
      if (nodeEvent.nfa_graph_data) setFinalNfaData(nodeEvent.nfa_graph_data)
      if (nodeEvent.dfa_graph_data) setFinalDfaData(nodeEvent.dfa_graph_data)
      if (nodeEvent.solution_snippet) setFinalSolution(nodeEvent.solution_snippet)

    } else if (type === 'done') {
      setStatus((payload.status as AgentStatus) || 'verified')
      setIsRunning(false)
      if (payload.final_solution) setFinalSolution(payload.final_solution as string)
      if (payload.nfa_graph_data) setFinalNfaData(payload.nfa_graph_data as string)
      if (payload.dfa_graph_data) setFinalDfaData(payload.dfa_graph_data as string)
    } else if (type === 'error') {
      setStatus('error')
      setIsRunning(false)
      setErrorMsg((payload.message as string) || 'Unknown error')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!problem.trim() || isRunning) return

    setIsRunning(true)
    setStatus('running')
    setEvents([])
    setFinalSolution('')
    setFinalNfaData('')
    setFinalDfaData('')
    setErrorMsg('')
    setIterations(0)
    setConsecutivePasses(0)
    setActiveTab(0)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/automata/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, max_iterations: 8, required_passes: 1 }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Request failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let pendingEventType = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          console.log('[SSE] Stream ended')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log('[SSE] Raw chunk received:', chunk)
        buffer += chunk
        
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) { pendingEventType = ''; continue }
          console.log('[SSE] Processing line:', line)
          
          if (line.startsWith('event: ')) {
            pendingEventType = line.slice(7).trim()
            console.log('[SSE] Parsed event type:', pendingEventType)
          } else if (line.startsWith('data: ') && pendingEventType) {
            const dataStr = line.slice(6).trim()
            console.log('[SSE] Parsed data string length:', dataStr.length)
            try {
              const payload = JSON.parse(dataStr)
              handleStreamEvent(pendingEventType, payload)
            } catch (err) { 
              console.error('[SSE] JSON parse error on data:', dataStr.substring(0, 50), '...', err)
            }
            pendingEventType = ''
          } else {
            console.log('[SSE] Unrecognized line format:', line)
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setStatus('error')
        setErrorMsg('Could not connect to the Automata backend.')
        setIsRunning(false)
      }
    }
  }, [problem, isRunning, handleStreamEvent])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsRunning(false)
    setStatus('idle')
  }

  // Visualizer Switch
  const renderVisualizer = () => {
    const activeDataRaw = activeTab === 0 ? finalNfaData : finalDfaData
    const data = parseGraphData(activeDataRaw)

    if (!data) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto text-red-400">
          <p>Failed to parse graph data. Raw output:</p>
          <pre className="text-[10px] mt-2 whitespace-pre-wrap">{activeDataRaw}</pre>
        </div>
      )
    }

    return (
      <div ref={graphContainerRef} className="w-full h-full relative group min-h-[400px]">
        <ForceGraph2D
          ref={fgRef}
          width={graphSize.width || undefined}
          height={graphSize.height || undefined}
          graphData={data}
          backgroundColor="transparent"
          nodeLabel="id"
          nodeRelSize={14}
          linkColor={() => 'rgba(255,255,255,0.3)'}
          linkWidth={1.5}
          linkCurvature={0.15}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          
          // Custom canvas rendering for Nodes
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.id || '';
            const R = 14; // Node Radius

            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, R, 0, 2 * Math.PI, false);
            ctx.fillStyle = '#0f0f11'; // Dark background
            ctx.fill();
            
            // Node Border
            ctx.lineWidth = 1.5 / globalScale;
            ctx.strokeStyle = node.is_final ? '#22c55e' : (node.is_start ? '#3b82f6' : '#6b7280');
            ctx.stroke();

            // Inner circle for final states
            if (node.is_final) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, R - 3.5, 0, 2 * Math.PI, false);
              ctx.lineWidth = 1 / globalScale;
              ctx.strokeStyle = '#22c55e';
              ctx.stroke();
            }

            // Start state incoming arrow indicator
            if (node.is_start) {
              ctx.beginPath();
              ctx.moveTo(node.x - R - 10, node.y);
              ctx.lineTo(node.x - R, node.y);
              ctx.moveTo(node.x - R - 4, node.y - 4);
              ctx.lineTo(node.x - R, node.y);
              ctx.lineTo(node.x - R - 4, node.y + 4);
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();
            }

            // Node Text
            let fontSize = 11;
            ctx.font = `600 ${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            // Scale down font if text is too wide for circle
            if (textWidth > R * 1.6) {
              fontSize = fontSize * (R * 1.6) / textWidth;
              ctx.font = `600 ${fontSize}px Sans-Serif`;
            }
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.is_final ? '#4ade80' : (node.is_start ? '#60a5fa' : '#e5e7eb');
            ctx.fillText(label, node.x, node.y);
          }}
          
          linkCanvasObjectMode={() => 'after'}
          linkCanvasObject={(link: any, ctx, globalScale) => {
            const start = link.source;
            const end = link.target;
            
            // ignore unbound links
            if (typeof start !== 'object' || typeof end !== 'object') return;

            let textPos;
            const curvature = 0.15;

            // Handle self loops differently
            if (start.id === end.id) {
              // Standard self-loop position for force-graph is slightly offset
              textPos = { x: start.x, y: start.y - 26 };
            } else {
              // Calculate midpoint on quadratic bezier curve
              const v = { x: end.x - start.x, y: end.y - start.y };
              const l = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
              const m = { x: start.x + v.x / 2, y: start.y + v.y / 2 };
              const n = { x: -v.y / l, y: v.x / l };
              
              const cp = { x: m.x + n.x * l * curvature, y: m.y + n.y * l * curvature };
              
              textPos = {
                x: 0.25 * start.x + 0.5 * cp.x + 0.25 * end.x,
                y: 0.25 * start.y + 0.5 * cp.y + 0.25 * end.y
              };
            }

            const label = link.label || 'ε';
            const fontSize = Math.max(8, 10 / globalScale);
            ctx.font = `700 ${fontSize}px Sans-Serif`;
            
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth + 8, fontSize + 4];

            // Pill Background
            ctx.fillStyle = 'rgba(5, 5, 5, 0.85)';
            ctx.beginPath();
            // @ts-ignore - roundRect is widely supported in modern browsers
            if (ctx.roundRect) {
              // @ts-ignore
              ctx.roundRect(
                textPos.x - bckgDimensions[0] / 2,
                textPos.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1],
                4
              );
            } else {
              ctx.fillRect(
                textPos.x - bckgDimensions[0] / 2,
                textPos.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
            }
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1/globalScale;
            ctx.stroke();

            // Text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'oklch(0.8 0.18 85)'; // Automata Accent Color
            ctx.fillText(label, textPos.x, textPos.y);
          }}
        />

        {/* Carousel Overlay UI */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-4 z-10 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
            <button 
              onClick={() => setActiveTab(0)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", activeTab === 0 ? "bg-[oklch(0.8_0.18_85)] text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/10")}
            >
              NFA Model
            </button>
            <button 
              onClick={() => setActiveTab(1)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", activeTab === 1 ? "bg-[oklch(0.8_0.18_85)] text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/10")}
            >
              DFA Result
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-background">
      <PanelGroup direction="horizontal" className="w-full h-full">
        {/* ── LEFT PANEL: Input & Timeline ── */}
        <Panel defaultSize={30} minSize={20} className="flex flex-col z-10 bg-black/20">
        
        {/* Header & Input */}
        <div className="p-5 border-b border-border/30 bg-black/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
              <GitMerge className="h-5 w-5" style={{ color: ACCENT }} />
              Automata Engine
            </h2>
            <StatusBadge status={status} />
          </div>
          
          <div className="relative">
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isRunning}
              placeholder="e.g., Convert an NFA that accepts strings ending in 'ab' over alphabet {a,b} to a DFA."
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
              rows={4}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed bg-black/50 border border-border/50 text-foreground focus:outline-none focus:border-[oklch(0.8_0.18_85)] transition-all placeholder:text-white/20 custom-scrollbar"
            />
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono break-words whitespace-pre-wrap">
              {errorMsg}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            {isRunning ? (
              <button onClick={handleStop} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 transition-colors">
                <XCircle className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!problem.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50" style={{ background: ACCENT, color: 'white' }}>
                <Play className="h-4 w-4" /> Execute Run
              </button>
            )}
          </div>
        </div>

        {/* Timeline Log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-border/10 flex justify-between items-center bg-black/20">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Execution Log</span>
            <span className="text-xs text-white/30 font-mono">Iter: {iterations}/8</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {events.length === 0 && !isRunning && (
              <p className="text-xs text-white/30 text-center mt-10">System idle. Awaiting command.</p>
            )}
            
            {events.map((ev, i) => {
              const cfg = NODE_CONFIG[ev.node] || NODE_CONFIG['algorithm_engine']
              const Icon = cfg.icon
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                    </div>
                    {i < events.length - 1 && <div className="w-px h-full mt-2 bg-white/5" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[10px] text-white/30">iter {ev.iteration}</span>
                    </div>
                    
                    {ev.subgoals && <pre className="mt-1.5 p-2 rounded-md text-[11px] whitespace-pre-wrap font-sans bg-black/40 border border-white/5 text-white/70 leading-relaxed">{ev.subgoals}</pre>}
                    {ev.feedback && <div className="mt-1.5 p-2 rounded-md text-[11px] font-mono whitespace-pre-wrap bg-red-500/10 border border-red-500/20 text-red-400">{ev.feedback}</div>}
                    {(ev.nfa_graph_data || ev.dfa_graph_data) && <div className="mt-1.5 text-[10px] text-white/40 flex items-center gap-1"><Eye className="h-3 w-3"/> Generated State Visualizations</div>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </Panel>

        {/* Custom Resize Handle */}
        <PanelResizeHandle className="w-1.5 bg-border/20 hover:bg-border/60 active:bg-[oklch(0.8_0.18_85)] transition-colors cursor-col-resize z-20" />

        {/* ── RIGHT PANEL: Hero Canvas & Output ── */}
        <Panel defaultSize={70} className="flex flex-col bg-[#050505] relative overflow-hidden">
          <PanelGroup direction="vertical" className="w-full h-full">
            
            {/* The Massive Visualizer */}
            <Panel defaultSize={60} minSize={20} className="relative flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[oklch(0.8_0.18_85_/_0.15)] via-black to-black">
              
              {/* Overlay Status */}
              {isRunning && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
                  <Loader2 className="h-3 w-3 animate-spin" style={{ color: ACCENT }} />
                  <span className="text-[10px] font-mono text-white/70">COMPUTING SUBSETS...</span>
                </div>
              )}

              <div className="w-full h-full max-h-[500px]">
                  {!finalNfaData && !finalDfaData ? (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                      <GitMerge className="h-16 w-16 mb-4 text-white" />
                      <p className="font-mono text-xs uppercase tracking-widest text-white/70">Waiting for graph data</p>
                    </div>
                  ) : (
                    renderVisualizer()
                  )}
              </div>
            </Panel>

            <PanelResizeHandle className="h-1.5 bg-border/20 hover:bg-border/60 active:bg-[oklch(0.8_0.18_85)] transition-colors cursor-row-resize z-20" />

            {/* The Solution Readout */}
            <Panel defaultSize={40} minSize={20}>
              <div className="h-full w-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" style={{ color: ACCENT }} />
                  Theoretical Output & Transition Tables
                </h3>
                
                {!finalSolution ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <p className="text-xs text-white/30 font-mono">No solution generated yet.</p>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert prose-sm max-w-none text-white/80 prose-tables:border-collapse prose-td:border prose-td:border-white/20 prose-td:px-4 prose-td:py-2 prose-th:border prose-th:border-white/20 prose-th:px-4 prose-th:py-2 prose-th:bg-white/5">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath, remarkGfm]} 
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="w-full overflow-x-auto custom-scrollbar my-4 rounded-lg border border-white/10">
                            <table {...props} className="w-full text-sm text-left" />
                          </div>
                        )
                      }}
                    >
                      {formatText(finalSolution)}
                    </ReactMarkdown>
                  </motion.div>
                )}
              </div>
            </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}
