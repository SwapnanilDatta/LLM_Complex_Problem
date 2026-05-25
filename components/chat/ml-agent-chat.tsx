'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend } from 'recharts'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import dynamic from 'next/dynamic'
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  BrainCircuit,
  Activity,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

// Dynamically import heavy visualization libraries (client-side only)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = 'idle' | 'running' | 'verified' | 'failed' | 'error'

interface NodeEvent {
  id: number
  node: 'problem_analyzer' | 'algorithm_engine' | 'ml_verifier'
  iteration: number
  solution_snippet?: string
  plot_data?: string
  plot_type?: string
  feedback?: string
  subgoals?: string
  status: AgentStatus
  full_update?: Record<string, unknown>
}

// ── Node config ───────────────────────────────────────────────────────────────
const NODE_CONFIG = {
  problem_analyzer: {
    label: 'Data Analyst',
    icon: BrainCircuit,
    color: 'oklch(0.7 0.15 220)',   // cyan/blue
    bg: 'oklch(0.7 0.15 220 / 0.12)',
    border: 'oklch(0.7 0.15 220 / 0.3)',
  },
  algorithm_engine: {
    label: 'Model Architect',
    icon: Cpu,
    color: 'oklch(0.7 0.2 320)',  // magenta (ML accent)
    bg: 'oklch(0.7 0.2 320 / 0.12)',
    border: 'oklch(0.7 0.2 320 / 0.3)',
  },
  ml_verifier: {
    label: 'Evaluator',
    icon: ShieldCheck,
    color: 'oklch(0.78 0.18 55)',   // amber
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

const parsePlotData = (dataStr: string | undefined) => {
  if (!dataStr) return null
  try {
    const parsed = JSON.parse(dataStr)
    // If it's an array, normalize the keys to ensure x, y, z exist
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => {
        const keys = Object.keys(item).filter(k => k.toLowerCase() !== 'class')
        const numKeys = keys.filter(k => typeof item[k] === 'number')
        
        let normalized = { ...item }
        if (!('x' in item) && numKeys.length > 0) normalized.x = item[numKeys[0]]
        if (!('y' in item) && numKeys.length > 1) normalized.y = item[numKeys[1]]
        if (!('z' in item) && numKeys.length > 2) normalized.z = item[numKeys[2]]
        return normalized
      })
    }
    return parsed
  } catch { return null }
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg: Record<AgentStatus, { label: string; cls: string }> = {
    idle:         { label: 'Ready',       cls: 'bg-white/5 text-white/40 border-white/10' },
    running:      { label: 'Computing…',  cls: 'bg-[oklch(0.7_0.2_320_/_0.15)] text-[oklch(0.7_0.2_320)] border-[oklch(0.7_0.2_320_/_0.3)] animate-pulse' },
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
export function MlAgentChat() {
  const [problem, setProblem] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [iterations, setIterations] = useState(0)
  const [consecutivePasses, setConsecutivePasses] = useState(0)
  const [events, setEvents] = useState<NodeEvent[]>([])
  const [finalSolution, setFinalSolution] = useState('')
  const [finalPlotData, setFinalPlotData] = useState('')
  const [finalPlotType, setFinalPlotType] = useState('area')
  const [errorMsg, setErrorMsg] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const ACCENT = 'oklch(0.7 0.2 320)'

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
        plot_data: payload.plot_data as string | undefined,
        plot_type: payload.plot_type as string | undefined,
        feedback: payload.feedback as string | undefined,
        subgoals: payload.subgoals as string | undefined,
        status: (payload.status as AgentStatus) || 'running',
        full_update: payload.full_update as Record<string, unknown> | undefined,
      }
      setEvents(prev => [...prev, nodeEvent])

      // Live update main display
      if (nodeEvent.plot_data) setFinalPlotData(nodeEvent.plot_data)
      if (nodeEvent.plot_type) setFinalPlotType(nodeEvent.plot_type)
      if (nodeEvent.solution_snippet) setFinalSolution(nodeEvent.solution_snippet)

    } else if (type === 'done') {
      setStatus((payload.status as AgentStatus) || 'verified')
      setIsRunning(false)
      if (payload.final_solution) setFinalSolution(payload.final_solution as string)
      if (payload.plot_data) setFinalPlotData(payload.plot_data as string)
      if (payload.plot_type) setFinalPlotType(payload.plot_type as string)
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
    setFinalPlotData('')
    setFinalPlotType('area')
    setErrorMsg('')
    setIterations(0)
    setConsecutivePasses(0)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/ml/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, max_iterations: 10, required_passes: 1 }),
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
        setErrorMsg('Could not connect to the ML backend.')
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
    if (!finalPlotData) return (
      <div className="flex flex-col items-center justify-center h-full text-white/20">
        <Activity className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">Awaiting Data Metrics</p>
      </div>
    )

    const data = parsePlotData(finalPlotData)
    if (!data) return <div className="text-red-500 p-4">Invalid JSON Plot Data</div>

    switch (finalPlotType) {
      case '3d_scatter': {
        const classes = Array.from(new Set(data.map((d: any) => d.class || 'Cluster')))
        const colors = ['#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
        
        const traces = classes.map((c, i) => {
          const subset = data.filter((d: any) => (d.class || 'Cluster') === c)
          return {
            x: subset.map((d: any) => d.x),
            y: subset.map((d: any) => d.y),
            z: subset.map((d: any) => d.z),
            mode: 'markers',
            type: 'scatter3d',
            name: String(c),
            marker: { size: 6, color: colors[i % colors.length], opacity: 0.8 }
          }
        })

        return (
          <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl overflow-hidden relative">
            {/* @ts-ignore */}
            <Plot
              data={traces}
              layout={{ 
                margin: { l: 0, r: 0, b: 0, t: 0 },
                paper_bgcolor: 'transparent',
                scene: { 
                  xaxis: { backgroundcolor: 'transparent', gridcolor: '#333' },
                  yaxis: { backgroundcolor: 'transparent', gridcolor: '#333' },
                  zaxis: { backgroundcolor: 'transparent', gridcolor: '#333' }
                },
                legend: { font: { color: 'white' }, x: 0, y: 1 }
              }}
              config={{ displayModeBar: false }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )
      }
      
      case 'force_graph':
        return (
          <div className="w-full h-full bg-black/40 rounded-xl overflow-hidden relative flex items-center justify-center">
            <ForceGraph2D
              graphData={data}
              linkColor={link => (link as any).in_path ? '#06b6d4' : 'rgba(255,255,255,0.1)'}
              linkWidth={link => (link as any).in_path ? 3 : 1}
              backgroundColor="transparent"
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.id
                const fontSize = 14 / globalScale
                ctx.font = `${fontSize}px Sans-Serif`
                
                // Draw node circle
                ctx.fillStyle = node.in_path ? '#06b6d4' : '#4b5563'
                ctx.beginPath()
                ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false)
                ctx.fill()
                
                // Draw text label below the node
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(label, node.x, node.y + 12)
              }}
            />
          </div>
        )

      case '2d_scatter': {
        const classes = Array.from(new Set(data.map((d: any) => d.class || 'Data')))
        const colors = ['#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" stroke="#9ca3af" fontSize={11} />
              <YAxis type="number" dataKey="y" stroke="#9ca3af" fontSize={11} />
              <ZAxis type="number" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'white' }} />
              {classes.map((c, i) => (
                <Scatter key={String(c)} name={String(c)} data={data.filter((d: any) => (d.class || 'Data') === c)} fill={colors[i % colors.length]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )
      }

      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="x" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
              <Area type="monotone" dataKey="y" stroke={ACCENT} strokeWidth={3} fillOpacity={1} fill="url(#colorMl)" />
            </AreaChart>
          </ResponsiveContainer>
        )
    }
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
              <Cpu className="h-5 w-5" style={{ color: ACCENT }} />
              ML Command Center
            </h2>
            <StatusBadge status={status} />
          </div>
          
          <div className="relative">
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isRunning}
              placeholder="e.g., Use BFS to find the shortest path in a graph and visualize it..."
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
              rows={4}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed bg-black/50 border border-border/50 text-foreground focus:outline-none focus:border-[oklch(0.7_0.2_320)] transition-all placeholder:text-white/20 custom-scrollbar"
            />
          </div>
          
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
            <span className="text-xs text-white/30 font-mono">Iter: {iterations}/10</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {events.length === 0 && !isRunning && (
              <p className="text-xs text-white/30 text-center mt-10">System idle. Awaiting command.</p>
            )}
            
            {events.map((ev, i) => {
              const cfg = NODE_CONFIG[ev.node]
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
                    {ev.plot_type && <div className="mt-1.5 text-[10px] text-white/40 flex items-center gap-1"><Eye className="h-3 w-3"/> Generated {ev.plot_type} visualization</div>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </Panel>

        {/* Custom Resize Handle */}
        <PanelResizeHandle className="w-1.5 bg-border/20 hover:bg-border/60 active:bg-[oklch(0.7_0.2_320)] transition-colors cursor-col-resize z-20" />

        {/* ── RIGHT PANEL: Hero Canvas & Output ── */}
        <Panel defaultSize={70} className="flex flex-col bg-[#050505] relative overflow-hidden">
          <PanelGroup direction="vertical" className="w-full h-full">
            
            {/* The Massive Visualizer */}
            <Panel defaultSize={60} minSize={20} className="relative flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[oklch(0.7_0.2_320_/_0.15)] via-black to-black">
          
          {/* Overlay Status */}
          {isRunning && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
              <Loader2 className="h-3 w-3 animate-spin" style={{ color: ACCENT }} />
              <span className="text-[10px] font-mono text-white/70">PROCESSING TENSORS...</span>
            </div>
          )}

          <div className="w-full h-full max-h-[500px]">
              {renderVisualizer()}
          </div>
        </Panel>

            <PanelResizeHandle className="h-1.5 bg-border/20 hover:bg-border/60 active:bg-[oklch(0.7_0.2_320)] transition-colors cursor-row-resize z-20" />

            {/* The Solution Readout */}
            <Panel defaultSize={40} minSize={20}>
              <div className="h-full w-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-sm font-bold text-white/80 mb-4 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" style={{ color: ACCENT }} />
              Algorithm Solution & Output
            </h3>
            
            {!finalSolution ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                <p className="text-xs text-white/30 font-mono">No solution generated yet.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="prose prose-invert prose-sm max-w-none text-white/80">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
