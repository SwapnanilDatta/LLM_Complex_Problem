'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sigma,
  Brain,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = 'idle' | 'running' | 'verified' | 'failed' | 'error' | 'sympy_failed'

interface NodeEvent {
  id: number
  node: 'decomposer' | 'generator' | 'sympy_checker' | 'verifier'
  iteration: number
  proof_snippet?: string
  plot_data?: string
  feedback?: string
  sympy_feedback?: string
  subgoals?: string
  status: AgentStatus
  full_update?: Record<string, unknown>
}

// ── Node config ───────────────────────────────────────────────────────────────
const NODE_CONFIG = {
  decomposer: {
    label: 'Decomposer',
    icon: Brain,
    color: 'oklch(0.7 0.2 280)',   // purple
    bg: 'oklch(0.7 0.2 280 / 0.12)',
    border: 'oklch(0.7 0.2 280 / 0.3)',
  },
  generator: {
    label: 'Generator',
    icon: Sigma,
    color: 'oklch(0.7 0.15 195)',  // teal (maths accent)
    bg: 'oklch(0.7 0.15 195 / 0.12)',
    border: 'oklch(0.7 0.15 195 / 0.3)',
  },
  sympy_checker: {
    label: 'SymPy Checker',
    icon: FlaskConical,
    color: 'oklch(0.75 0.18 145)',  // green
    bg: 'oklch(0.75 0.18 145 / 0.12)',
    border: 'oklch(0.75 0.18 145 / 0.3)',
  },
  verifier: {
    label: 'Verifier',
    icon: ShieldCheck,
    color: 'oklch(0.78 0.18 55)',   // amber
    bg: 'oklch(0.78 0.18 55 / 0.12)',
    border: 'oklch(0.78 0.18 55 / 0.3)',
  },
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg: Record<AgentStatus, { label: string; cls: string }> = {
    idle:         { label: 'Ready',       cls: 'bg-white/5 text-white/40 border-white/10' },
    running:      { label: 'Thinking…',   cls: 'bg-[oklch(0.7_0.15_195_/_0.15)] text-[oklch(0.7_0.15_195)] border-[oklch(0.7_0.15_195_/_0.3)] animate-pulse' },
    verified:     { label: 'Verified ✓',  cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)]' },
    failed:       { label: 'Failed',      cls: 'bg-[oklch(0.577_0.245_27_/_0.15)] text-[oklch(0.677_0.245_27)] border-[oklch(0.577_0.245_27_/_0.3)]' },
    error:        { label: 'Error',       cls: 'bg-[oklch(0.577_0.245_27_/_0.15)] text-[oklch(0.677_0.245_27)] border-[oklch(0.577_0.245_27_/_0.3)]' },
    sympy_failed: { label: 'SymPy Failed',cls: 'bg-[oklch(0.78_0.18_55_/_0.15)] text-[oklch(0.78_0.18_55)] border-[oklch(0.78_0.18_55_/_0.3)]' },
  }
  const { label, cls } = cfg[status]
  return (
    <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border', cls)}>
      {label}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatProofText = (text: string | undefined) => {
  if (!text) return ''
  let formatted = text
  // Remove the <check> tags but KEEP the mathematical content inside!
  formatted = formatted.replace(/<\/?check>/gi, '')
  // Replace <subgoal n> tags with nice headers
  formatted = formatted.replace(/<subgoal\s+(\d+)>/gi, '\n### Subgoal $1\n')
  formatted = formatted.replace(/<\/subgoal\s+\d+>/gi, '\n')
  return formatted.trim()
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 border border-border/50 p-3 rounded-lg backdrop-blur-md">
        <p className="m-0 text-xs text-muted-foreground">X-Axis: {label}</p>
        <p className="m-0 text-sm font-bold text-[oklch(0.7_0.15_195)]">Y-Axis: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

const parsePlotData = (dataStr: string | undefined) => {
  if (!dataStr) return null
  try {
    const parsed = JSON.parse(dataStr)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch { return null }
  return null
}

const renderPlot = (plotDataStr: string | undefined) => {
  const data = parsePlotData(plotDataStr)
  if (!data) return null
  return (
    <div className="mt-4 p-4 bg-black/20 rounded-xl border border-border/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h4 className="text-sm font-semibold mb-4 text-[oklch(0.7_0.15_195)] flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Function Visualization
      </h4>
      <div className="w-full h-[280px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.7 0.15 195)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="oklch(0.7 0.15 195)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="x" stroke="#9ca3af" fontSize={11} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="y" stroke="oklch(0.7 0.15 195)" strokeWidth={3} fillOpacity={1} fill="url(#colorY)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Individual event card ─────────────────────────────────────────────────────
function EventCard({ ev }: { ev: NodeEvent }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = NODE_CONFIG[ev.node]
  const Icon = cfg.icon

  const sympyPassed = ev.node === 'sympy_checker' && ev.sympy_feedback && !ev.sympy_feedback.includes('error')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color.replace(')', ' / 0.15)').replace('oklch(', 'oklch(')}`, border: `1px solid ${cfg.border}` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          {ev.node === 'verifier' && ev.feedback === 'Proof passed verification.' && (
            <CheckCircle2 className="h-4 w-4 text-[oklch(0.75_0.18_145)]" />
          )}
          {ev.node === 'sympy_checker' && (
            sympyPassed
              ? <CheckCircle2 className="h-4 w-4 text-[oklch(0.75_0.18_145)]" />
              : <AlertTriangle className="h-4 w-4 text-[oklch(0.78_0.18_55)]" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">iter {ev.iteration}</span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pb-4 space-y-2">
        {/* Decomposer → subgoals */}
        {ev.node === 'decomposer' && ev.subgoals && (
          <div
            className="rounded-lg p-3 text-sm leading-relaxed"
            style={{
              background: 'oklch(0.7 0.2 280 / 0.08)',
              borderLeft: '3px solid oklch(0.7 0.2 280 / 0.6)',
            }}
          >
            <p className="text-xs font-semibold text-[oklch(0.7_0.2_280)] mb-2 uppercase tracking-wider">
              Strategic Breakdown
            </p>
            <pre className="whitespace-pre-wrap font-sans text-foreground/80 text-sm">{ev.subgoals}</pre>
          </div>
        )}

        {/* Generator → proof snippet */}
        {ev.node === 'generator' && ev.proof_snippet && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'oklch(0.05 0 0 / 0.5)' }}>
            <p className="text-xs font-semibold text-[oklch(0.7_0.15_195)] mb-2 uppercase tracking-wider">
              Proof Preview
            </p>
            <div className="prose prose-invert prose-sm max-w-none overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {formatProofText(ev.proof_snippet)}
              </ReactMarkdown>
            </div>
            {ev.plot_data && renderPlot(ev.plot_data)}
          </div>
        )}

        {/* SymPy checker */}
        {ev.node === 'sympy_checker' && ev.sympy_feedback && (
          <div
            className="rounded-lg p-3 text-sm font-mono whitespace-pre-wrap"
            style={
              sympyPassed
                ? { background: 'oklch(0.75 0.18 145 / 0.08)', borderLeft: '3px solid oklch(0.75 0.18 145 / 0.5)', color: 'oklch(0.8 0.12 145)' }
                : { background: 'oklch(0.577 0.245 27 / 0.08)', borderLeft: '3px solid oklch(0.577 0.245 27 / 0.5)', color: 'oklch(0.7 0.2 27)' }
            }
          >
            {ev.sympy_feedback}
          </div>
        )}

        {/* Verifier → feedback */}
        {ev.node === 'verifier' && ev.feedback && ev.feedback !== 'Proof passed verification.' && (
          <div
            className="rounded-lg p-3 text-sm font-mono whitespace-pre-wrap"
            style={{ background: 'oklch(0.577 0.245 27 / 0.08)', borderLeft: '3px solid oklch(0.577 0.245 27 / 0.5)', color: 'oklch(0.7 0.2 27)' }}
          >
            {ev.feedback}
          </div>
        )}
        {ev.node === 'verifier' && ev.feedback === 'Proof passed verification.' && (
          <p className="text-sm text-[oklch(0.75_0.18_145)] font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Proof passed logical verification
          </p>
        )}

        {/* Expanded raw JSON */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <pre
                className="text-xs font-mono p-3 rounded-lg overflow-x-auto mt-2"
                style={{ background: 'oklch(0.05 0 0 / 0.7)', color: 'oklch(0.6 0 0)' }}
              >
                {JSON.stringify(ev.full_update || ev, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MathsAgentChat() {
  const [problem, setProblem] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [iterations, setIterations] = useState(0)
  const [consecutivePasses, setConsecutivePasses] = useState(0)
  const [events, setEvents] = useState<NodeEvent[]>([])
  const [finalProof, setFinalProof] = useState('')
  const [finalPlotData, setFinalPlotData] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const streamEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

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
      setEvents(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          node: payload.node as NodeEvent['node'],
          iteration: (payload.iteration as number) || 0,
          proof_snippet: payload.proof_snippet as string | undefined,
          plot_data: payload.plot_data as string | undefined,
          feedback: payload.feedback as string | undefined,
          sympy_feedback: payload.sympy_feedback as string | undefined,
          subgoals: payload.subgoals as string | undefined,
          status: (payload.status as AgentStatus) || 'running',
          full_update: payload.full_update as Record<string, unknown> | undefined,
        },
      ])
    } else if (type === 'done') {
      setStatus((payload.status as AgentStatus) || 'verified')
      setIsRunning(false)
      if (payload.final_proof) setFinalProof(payload.final_proof as string)
      if (payload.plot_data) setFinalPlotData(payload.plot_data as string)
    } else if (type === 'error') {
      setStatus('error')
      setIsRunning(false)
      setErrorMsg((payload.message as string) || 'Unknown error')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!problem.trim() || isRunning) return

    // Reset state
    setIsRunning(true)
    setStatus('running')
    setEvents([])
    setFinalProof('')
    setFinalPlotData('')
    setErrorMsg('')
    setIterations(0)
    setConsecutivePasses(0)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/maths/prove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, max_iterations: 10, required_passes: 1 }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        setErrorMsg(err.error || 'Backend error')
        setStatus('error')
        setIsRunning(false)
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let pendingEventType = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) { pendingEventType = ''; continue }

          if (line.startsWith('event: ')) {
            pendingEventType = line.slice(7).trim()
          } else if (line.startsWith('data: ') && pendingEventType) {
            try {
              const payload = JSON.parse(line.slice(6).trim())
              handleStreamEvent(pendingEventType, payload)
            } catch { /* skip malformed */ }
            pendingEventType = ''
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setStatus('error')
        setErrorMsg('Could not connect to the Maths backend. Make sure it is running on port 8000.')
        setIsRunning(false)
      }
    }
  }, [problem, isRunning, handleStreamEvent])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsRunning(false)
    setStatus('idle')
  }

  const handleReset = () => {
    handleStop()
    setProblem('')
    setEvents([])
    setFinalProof('')
    setFinalPlotData('')
    setErrorMsg('')
    setStatus('idle')
    setIterations(0)
    setConsecutivePasses(0)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const ACCENT = 'oklch(0.7 0.15 195)'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top input panel ── */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border/50">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Problem textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={isRunning}
              placeholder="Enter a complex mathematics problem or theorem to prove…&#10;&#10;e.g. Prove that √2 is irrational."
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
              rows={3}
              className={cn(
                'w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed',
                'bg-card border text-foreground placeholder:text-muted-foreground/50',
                'focus:outline-none transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{
                borderColor: isRunning ? `${ACCENT}44` : 'oklch(0.2 0 0)',
                boxShadow: isRunning ? `0 0 0 2px ${ACCENT}22` : undefined,
              }}
            />
            <p className="absolute bottom-2.5 right-3 text-[10px] text-muted-foreground/40 pointer-events-none">
              Ctrl+Enter to run
            </p>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Status + counters */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={status} />
              {(isRunning || status !== 'idle') && (
                <>
                  <span className="text-xs text-muted-foreground">
                    Iter <strong className="text-foreground">{iterations}</strong>/10
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Passes <strong className="text-foreground">{consecutivePasses}</strong>
                  </span>
                </>
              )}
              {errorMsg && (
                <span className="text-xs text-[oklch(0.677_0.245_27)] flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {errorMsg}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {(events.length > 0 || finalProof) && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              )}

              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'oklch(0.577 0.245 27 / 0.15)',
                    color: 'oklch(0.677 0.245 27)',
                    border: '1px solid oklch(0.577 0.245 27 / 0.3)',
                  }}
                >
                  <XCircle className="h-4 w-4" /> Stop
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!problem.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: problem.trim() ? ACCENT : 'oklch(0.15 0 0)',
                    color: problem.trim() ? 'oklch(0.03 0 0)' : 'oklch(0.4 0 0)',
                    boxShadow: problem.trim() ? `0 0 20px ${ACCENT}44` : undefined,
                  }}
                >
                  {isRunning
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Proving…</>
                    : <><Play className="h-4 w-4" /> Generate Proof</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-panel body ── */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left — Thought Process Stream */}
        <Panel defaultSize={30} minSize={20} className="flex flex-col bg-black/10">
          {/* Panel header */}
          <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-border/30">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Thought Process</h3>
            {isRunning && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: ACCENT }}
                />
                Live
              </motion.div>
            )}
            {events.length > 0 && !isRunning && (
              <span className="ml-auto text-xs text-muted-foreground">{events.length} events</span>
            )}
          </div>

          {/* Event stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {events.length === 0 && !isRunning && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: `${ACCENT.replace(')', ' / 0.08)').replace('oklch(', 'oklch(')}`,
                    border: `1px solid ${ACCENT.replace(')', ' / 0.2)').replace('oklch(', 'oklch(')}`,
                  }}
                >
                  <Sparkles className="h-7 w-7" style={{ color: ACCENT }} />
                </motion.div>
                <p className="text-sm font-medium text-foreground/70">Ready to prove</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Enter a problem above and click Generate Proof to watch the agent reason step by step.
                </p>
              </div>
            )}

            {events.map(ev => (
              <EventCard key={ev.id} ev={ev} />
            ))}

            {/* Live pulse while running and no events yet */}
            {isRunning && events.length === 0 && (
              <div className="flex items-center gap-3 p-4">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: ACCENT }} />
                <span className="text-sm text-muted-foreground">Initialising agent…</span>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-border/20 hover:bg-border/60 active:bg-[oklch(0.7_0.15_195)] transition-colors cursor-col-resize z-20" />

        {/* Right — Final Proof */}
        <Panel defaultSize={70} minSize={30} className="flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-border/30">
            <Sigma className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Final Proof</h3>
            {status === 'verified' && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'oklch(0.75 0.18 145 / 0.15)', color: 'oklch(0.75 0.18 145)' }}
              >
                ✓ Verified
              </span>
            )}
          </div>

          {/* Proof panel */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait">
              {!finalProof && isRunning && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center"
                >
                  {/* Animated proof-building skeleton */}
                  <div className="w-full max-w-sm space-y-3">
                    {[0.7, 0.5, 0.9, 0.4, 0.65].map((w, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        className="h-3 rounded-full bg-white/10"
                        style={{ width: `${w * 100}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Waiting for convergence…</p>
                </motion.div>
              )}

              {!finalProof && !isRunning && status === 'idle' && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-16"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: `${ACCENT.replace(')', ' / 0.06)').replace('oklch(', 'oklch(')}`,
                      border: `1px solid ${ACCENT.replace(')', ' / 0.15)').replace('oklch(', 'oklch(')}`,
                    }}
                  >
                    <Sigma className="h-7 w-7" style={{ color: ACCENT, opacity: 0.5 }} />
                  </div>
                  <p className="text-sm text-muted-foreground/60">No proof generated yet</p>
                </motion.div>
              )}

              {finalProof && (
                <motion.div
                  key="proof"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Status header */}
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 border"
                    style={
                      status === 'verified'
                        ? { background: 'oklch(0.75 0.18 145 / 0.08)', borderColor: 'oklch(0.75 0.18 145 / 0.3)' }
                        : { background: 'oklch(0.577 0.245 27 / 0.08)', borderColor: 'oklch(0.577 0.245 27 / 0.3)' }
                    }
                  >
                    {status === 'verified'
                      ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.75 0.18 145)' }} />
                      : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.78 0.18 55)' }} />
                    }
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: status === 'verified' ? 'oklch(0.75 0.18 145)' : 'oklch(0.78 0.18 55)' }}
                      >
                        {status === 'verified' ? 'Proof Verified' : 'Best Attempt'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Completed in {iterations} iteration{iterations !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* The proof and visualization containers */}
                  <div
                    className="rounded-xl p-5 border flex flex-col gap-4"
                    style={{
                      background: 'oklch(0.06 0 0)',
                      borderColor: status === 'verified' ? 'oklch(0.75 0.18 145 / 0.2)' : 'oklch(0.2 0 0)',
                    }}
                  >
                    {/* The Visualization (if any) */}
                    {finalPlotData && (
                      <div className="rounded-xl border border-border/10 bg-black/40 mb-2">
                        {renderPlot(finalPlotData)}
                      </div>
                    )}

                    {/* The Final Proof Text */}
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {formatProofText(finalProof)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
