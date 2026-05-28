'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Brain,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Zap,
  Paperclip,
  Trash2,
  Image as ImageIcon,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/store'
import 'katex/dist/katex.min.css'

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = 'idle' | 'started' | 'routing' | 'executing' | 'formatting' | 'sketching' | 'completed' | 'error' | 'running' | 'generating' | 'critiquing' | 'retrying'

interface NodeEvent {
  id: number
  node: 'intent_classifier' | 'compute_codegen' | 'compute_sandboxed_execute' | 'compute_format_answer' | 'proof_planner' | 'proof_generator' | 'proof_critic' | string
  mode?: string
  code_snippet?: string
  execution_result?: string
  retry_count?: number
  planner_strategy?: string
  current_proof?: string
  critic_feedback?: string
  proof_iterations?: number
  proof_snippet?: string
  final_answer_snippet?: string
  status: AgentStatus
  full_update?: Record<string, unknown>
}

// ── Node config ───────────────────────────────────────────────────────────────
const NODE_CONFIG: Record<string, { label: string, icon: any, color: string, bg: string, border: string }> = {
  intent_classifier: {
    label: 'Intent Classifier',
    icon: Brain,
    color: 'oklch(0.7 0.2 280)',   // purple
    bg: 'oklch(0.7 0.2 280 / 0.12)',
    border: 'oklch(0.7 0.2 280 / 0.3)',
  },
  compute_codegen: {
    label: 'CodeGen',
    icon: Cpu,
    color: 'oklch(0.68 0.25 220)',  // teal (ml accent)
    bg: 'oklch(0.7 0.15 195 / 0.12)',
    border: 'oklch(0.7 0.15 195 / 0.3)',
  },
  compute_sandboxed_execute: {
    label: 'Sandboxed Execute',
    icon: FlaskConical,
    color: 'oklch(0.75 0.18 145)',  // green
    bg: 'oklch(0.75 0.18 145 / 0.12)',
    border: 'oklch(0.75 0.18 145 / 0.3)',
  },
  compute_format_answer: {
    label: 'Format Answer',
    icon: CheckCircle2,
    color: 'oklch(0.78 0.18 55)',   // amber
    bg: 'oklch(0.78 0.18 55 / 0.12)',
    border: 'oklch(0.78 0.18 55 / 0.3)',
  },
  proof_planner: {
    label: 'Planner',
    icon: Brain,
    color: 'oklch(0.7 0.2 280)',   // purple
    bg: 'oklch(0.7 0.2 280 / 0.12)',
    border: 'oklch(0.7 0.2 280 / 0.3)',
  },
  proof_generator: {
    label: 'Generator',
    icon: Zap,
    color: 'oklch(0.68 0.25 220)',  // blue
    bg: 'oklch(0.68 0.25 220 / 0.12)',
    border: 'oklch(0.68 0.25 220 / 0.3)',
  },
  proof_critic: {
    label: 'Critic',
    icon: ShieldCheck,
    color: 'oklch(0.75 0.18 145)',  // green
    bg: 'oklch(0.75 0.18 145 / 0.12)',
    border: 'oklch(0.75 0.18 145 / 0.3)',
  },
  // --- New Deterministic Pipeline Nodes ---
  vision: {
    label: 'Vision Analysis',
    icon: ImageIcon,
    color: 'oklch(0.65 0.2 240)',
    bg: 'oklch(0.65 0.2 240 / 0.12)',
    border: 'oklch(0.65 0.2 240 / 0.3)',
  },
  intent: {
    label: 'Intent Detection',
    icon: Brain,
    color: 'oklch(0.7 0.2 280)',
    bg: 'oklch(0.7 0.2 280 / 0.12)',
    border: 'oklch(0.7 0.2 280 / 0.3)',
  },
  builder: {
    label: 'Problem Builder',
    icon: Cpu,
    color: 'oklch(0.68 0.25 220)',
    bg: 'oklch(0.7 0.15 195 / 0.12)',
    border: 'oklch(0.7 0.15 195 / 0.3)',
  },
  solver: {
    label: 'Deterministic Solver',
    icon: FlaskConical,
    color: 'oklch(0.78 0.18 55)',
    bg: 'oklch(0.78 0.18 55 / 0.12)',
    border: 'oklch(0.78 0.18 55 / 0.3)',
  },
  verifier: {
    label: 'Verifier',
    icon: ShieldCheck,
    color: 'oklch(0.75 0.18 145)',
    bg: 'oklch(0.75 0.18 145 / 0.12)',
    border: 'oklch(0.75 0.18 145 / 0.3)',
  },
  explanation: {
    label: 'Explanation (LLM)',
    icon: Sparkles,
    color: 'oklch(0.68 0.25 220)',
    bg: 'oklch(0.68 0.25 220 / 0.12)',
    border: 'oklch(0.68 0.25 220 / 0.3)',
  },
  visualization: {
    label: 'Visualization',
    icon: Zap,
    color: 'oklch(0.68 0.25 220)',
    bg: 'oklch(0.7 0.15 195 / 0.12)',
    border: 'oklch(0.7 0.15 195 / 0.3)',
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg: Record<AgentStatus, { label: string; cls: string }> = {
    idle:         { label: 'Ready',       cls: 'bg-white/5 text-white/40 border-white/10' },
    started:      { label: 'Thinking…',   cls: 'bg-[oklch(0.7_0.15_195_/_0.15)] text-[oklch(0.7_0.15_195)] border-[oklch(0.7_0.15_195_/_0.3)] animate-pulse' },
    running:      { label: 'Thinking…',   cls: 'bg-[oklch(0.7_0.15_195_/_0.15)] text-[oklch(0.7_0.15_195)] border-[oklch(0.7_0.15_195_/_0.3)] animate-pulse' },
    routing:      { label: 'Routing…',    cls: 'bg-[oklch(0.7_0.2_280_/_0.15)] text-[oklch(0.7_0.2_280)] border-[oklch(0.7_0.2_280_/_0.3)] animate-pulse' },
    executing:    { label: 'Executing…',  cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)] animate-pulse' },
    formatting:   { label: 'Formatting…', cls: 'bg-[oklch(0.78_0.18_55_/_0.15)] text-[oklch(0.78_0.18_55)] border-[oklch(0.78_0.18_55_/_0.3)] animate-pulse' },
    sketching:    { label: 'Proving…',    cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)] animate-pulse' },
    generating:   { label: 'Generating…', cls: 'bg-[oklch(0.68_0.25_220_/_0.15)] text-[oklch(0.68_0.25_220)] border-[oklch(0.68_0.25_220_/_0.3)] animate-pulse' },
    critiquing:   { label: 'Critiquing…', cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)] animate-pulse' },
    retrying:     { label: 'Retrying…',   cls: 'bg-[oklch(0.7_0.15_195_/_0.15)] text-[oklch(0.7_0.15_195)] border-[oklch(0.7_0.15_195_/_0.3)] animate-pulse' },
    completed:    { label: 'Done ✓',      cls: 'bg-[oklch(0.75_0.18_145_/_0.15)] text-[oklch(0.75_0.18_145)] border-[oklch(0.75_0.18_145_/_0.3)]' },
    error:        { label: 'Error',       cls: 'bg-[oklch(0.577_0.245_27_/_0.15)] text-[oklch(0.677_0.245_27)] border-[oklch(0.577_0.245_27_/_0.3)]' },
  }
  const { label, cls } = cfg[status] || cfg['started']
  return (
    <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border', cls)}>
      {label}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatText = (text: string | undefined) => {
  if (!text) return ''
  return text.trim()
}

// ── Individual event card ─────────────────────────────────────────────────────
function EventCard({ ev }: { ev: NodeEvent }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = NODE_CONFIG[ev.node] || NODE_CONFIG['intent_classifier']
  const Icon = cfg.icon

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
          {ev.status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-[oklch(0.75_0.18_145)]" />
          )}
        </div>
        <div className="flex items-center gap-3">
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
        {/* Intent Detection */}
        {(ev.node === 'intent_classifier' || ev.node === 'intent') && ev.mode && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'oklch(0.7 0.2 280 / 0.08)', borderLeft: '3px solid oklch(0.7 0.2 280 / 0.6)' }}>
            <p className="text-xs font-semibold text-[oklch(0.7_0.2_280)] mb-1 uppercase tracking-wider">Detected Domain</p>
            <p className="font-sans text-foreground/90">{ev.mode.toUpperCase()}</p>
          </div>
        )}

        {/* Problem Builder */}
        {(ev.node === 'compute_codegen' || ev.node === 'builder') && ev.code_snippet && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'oklch(0.05 0 0 / 0.5)' }}>
            <p className="text-xs font-semibold text-[oklch(0.7_0.15_195)] mb-2 uppercase tracking-wider">Structured Problem (Code)</p>
            <pre className="text-xs font-mono p-3 rounded bg-black/40 overflow-x-auto text-[oklch(0.8_0.15_195)]">
              {ev.code_snippet}
            </pre>
          </div>
        )}

        {/* Deterministic Solver */}
        {(ev.node === 'compute_sandboxed_execute' || ev.node === 'solver') && ev.execution_result && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'oklch(0.78 0.18 55 / 0.08)', borderLeft: '3px solid oklch(0.78 0.18 55 / 0.5)' }}>
            <p className="text-xs font-semibold text-[oklch(0.78_0.18_55)] mb-2 uppercase tracking-wider">Execution Output</p>
            <pre className="text-xs font-mono p-3 rounded bg-black/40 overflow-x-auto text-[oklch(0.88_0.18_55)]">
              {ev.execution_result}
            </pre>
          </div>
        )}

        {/* Verifier */}
        {(ev.node === 'proof_critic' || ev.node === 'verifier') && (
          <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: 'oklch(0.75 0.18 145 / 0.08)', borderLeft: '3px solid oklch(0.75 0.18 145 / 0.6)' }}>
            {ev.critic_feedback ? (
              <>
                <p className="text-xs font-semibold text-[oklch(0.75_0.18_145)] mb-2 uppercase tracking-wider">Verification Notes</p>
                <p className="whitespace-pre-wrap font-sans text-foreground/80">{ev.critic_feedback}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-[oklch(0.75_0.18_145)] mb-2 uppercase tracking-wider">✓ Verified</p>
                <p className="whitespace-pre-wrap font-sans text-foreground/80">Deterministic results verified successfully!</p>
              </>
            )}
          </div>
        )}
        
        {/* Explanation (LLM) */}
        {(ev.node === 'proof_generator' || ev.node === 'explanation') && ev.current_proof && (
          <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: 'oklch(0.68 0.25 220 / 0.08)', borderLeft: '3px solid oklch(0.68 0.25 220 / 0.6)' }}>
            <p className="text-xs font-semibold text-[oklch(0.68_0.25_220)] mb-2 uppercase tracking-wider">Educational Explanation</p>
            <p className="whitespace-pre-wrap font-sans text-foreground/80 line-clamp-4">{ev.current_proof}</p>
          </div>
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
export function MlAgentChat() {
  const { activeChatByAgent, chatsByAgent, updateChatLocally, saveChatUpdate } = useChatStore()
  const activeChatId = activeChatByAgent['ml']
  const currentChat = chatsByAgent['ml'].find(c => c.id === activeChatId)

  const problem = currentChat?.problem || ''
  const status = (currentChat?.status as AgentStatus) || 'idle'
  const events = (currentChat?.events as NodeEvent[]) || []
  const finalAnswer = currentChat?.finalAnswer || ''
  const errorMsg = currentChat?.errorMsg || ''
  const attachments = (currentChat?.attachments as {name: string, type: string, data: string}[]) || []
  const isRunning = status !== 'idle' && status !== 'completed' && status !== 'error'

  const history = (currentChat?.history as any[]) || []
  const [followUpText, setFollowUpText] = useState('')
  const [forceMode, setForceMode] = useState('auto')

  const setProblem = (val: string) => {
    if (activeChatId) updateChatLocally(activeChatId, { problem: val }, 'ml')
  }

  const setAttachments = (updater: any) => {
    if (activeChatId) {
      const newAtt = typeof updater === 'function' ? updater(attachments) : updater
      updateChatLocally(activeChatId, { attachments: newAtt }, 'ml')
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const handleStreamEvent = useCallback((type: string, payload: Record<string, unknown>) => {
    if (!activeChatId) return;
    if (type === 'start') {
      updateChatLocally(activeChatId, { status: 'started' }, 'ml')
    } else if (type === 'node_update') {
      const newStatus = (payload.status as AgentStatus) || 'running'
      const newEvent = {
        id: Date.now() + Math.random(),
        node: payload.node as string,
        ...payload,
        status: newStatus,
      } as NodeEvent
      
      const current = useChatStore.getState().chatsByAgent['ml'].find(c => c.id === activeChatId)
      const updatedEvents = [...(current?.events || []), newEvent]
      
      updateChatLocally(activeChatId, { status: newStatus, events: updatedEvents as any }, 'ml')
      saveChatUpdate(activeChatId, { status: newStatus, events: updatedEvents as any })
    } else if (type === 'done') {
      updateChatLocally(activeChatId, { status: 'completed', finalAnswer: payload.final_answer as string }, 'ml')
      saveChatUpdate(activeChatId, { status: 'completed', finalAnswer: payload.final_answer as string })
    } else if (type === 'error') {
      updateChatLocally(activeChatId, { status: 'error', errorMsg: (payload.message as string) || 'Unknown error' }, 'ml')
      saveChatUpdate(activeChatId, { status: 'error', errorMsg: (payload.message as string) || 'Unknown error' })
    }
  }, [activeChatId, updateChatLocally, saveChatUpdate])

  const executeQuery = useCallback(async (queryText: string, isFollowUp: boolean = false) => {
    if (!queryText.trim() || isRunning || !activeChatId) return

    let currentHistory = history
    if (isFollowUp && problem && finalAnswer && status === 'completed') {
      const newTurn = {
        id: crypto.randomUUID(),
        problem: problem,
        finalAnswer: finalAnswer
      }
      currentHistory = [...history, newTurn]
    }

    let fullPrompt = queryText
    if (currentHistory.length > 0) {
      const recentHistory = currentHistory.slice(-3)
      const historyContext = recentHistory.map((h, i) => `[Turn ${i+1}]\nQuestion: ${h.problem}\nAnswer: ${h.finalAnswer}`).join('\n\n')
      fullPrompt = `[Previous Context]\n${historyContext}\n\n[Current Question]\n${queryText}`
    }

    const titleToSave = currentChat?.title === 'New Chat' ? queryText.slice(0, 40) + (queryText.length > 40 ? '...' : '') : currentChat?.title

    updateChatLocally(activeChatId, { 
      status: 'started',
      events: [],
      finalAnswer: '',
      errorMsg: '',
      problem: queryText,
      history: currentHistory,
      title: titleToSave
    }, 'ml')

    saveChatUpdate(activeChatId, {
      status: 'started',
      events: [],
      finalAnswer: '',
      errorMsg: '',
      problem: queryText,
      history: currentHistory,
      title: titleToSave
    })

    setFollowUpText('')
    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/ml/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: fullPrompt, force_mode: forceMode, attachments }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        updateChatLocally(activeChatId, { status: 'error', errorMsg: err.error || 'Backend error' }, 'ml')
        saveChatUpdate(activeChatId, { status: 'error', errorMsg: err.error || 'Backend error' })
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
        updateChatLocally(activeChatId, { status: 'error', errorMsg: 'Could not connect to the backend.' }, 'ml')
        saveChatUpdate(activeChatId, { status: 'error', errorMsg: 'Could not connect to the backend.' })
      }
    }
  }, [problem, finalAnswer, status, history, isRunning, handleStreamEvent, activeChatId, currentChat?.title, attachments, forceMode, updateChatLocally, saveChatUpdate])

  const handleSubmit = () => executeQuery(problem, false)
  const handleFollowUp = (text: string) => executeQuery(text, true)

  const handleStop = () => {
    abortRef.current?.abort()
    if (activeChatId) {
      updateChatLocally(activeChatId, { status: 'idle' }, 'ml')
      saveChatUpdate(activeChatId, { status: 'idle' })
    }
  }

  const handleReset = () => {
    handleStop()
    if (activeChatId) {
      updateChatLocally(activeChatId, { problem: '', events: [], finalAnswer: '', errorMsg: '', attachments: [], status: 'idle' }, 'ml')
      saveChatUpdate(activeChatId, { problem: '', events: [], finalAnswer: '', errorMsg: '', attachments: [], status: 'idle' })
    }
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const data = event.target?.result as string
        const isImage = file.type.startsWith('image/')
        setAttachments(prev => [...prev, { name: file.name, type: isImage ? 'image' : 'file', data }])
      }
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const ACCENT = 'oklch(0.68 0.25 220)'

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
              placeholder="Enter a complex mathematics problem or theorem to prove…&#10;&#10;e.g. Prove that √2 is irrational or Solve x^2 - 5x + 6 = 0."
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
              rows={3}
              className={cn(
                'w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed',
                'bg-black/40 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:bg-black/60 shadow-inner',
                'focus:outline-none transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{
                borderColor: isRunning ? `${ACCENT}44` : 'oklch(0.2 0 0)',
                boxShadow: isRunning ? `0 0 0 2px ${ACCENT}22` : undefined,
              }}
            />
            <div className="absolute bottom-2.5 right-3 flex items-center gap-2 pointer-events-none">
              <p className="text-[10px] text-muted-foreground/40">Ctrl+Enter to run</p>
            </div>
          </div>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                  {att.type === 'image' ? <ImageIcon className="h-3 w-3 text-[oklch(0.68_0.25_220)]" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                  <span className="max-w-[150px] truncate text-muted-foreground">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="hover:text-destructive transition-colors ml-1">
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Status + counters */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={status} />
              {errorMsg && (
                <span className="text-xs text-[oklch(0.677_0.245_27)] flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {errorMsg}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,.txt,.csv,.json,.py,.js,.md" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
              >
                <Paperclip className="h-3.5 w-3.5" /> Attach
              </button>

              <select
                value={forceMode}
                onChange={e => setForceMode(e.target.value)}
                disabled={isRunning}
                className="bg-black/20 border border-border/50 text-xs text-muted-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:border-[oklch(0.7_0.15_195)] transition-colors disabled:opacity-50"
              >
                <option value="auto">Auto (Intent)</option>
                <option value="compute">Force Compute</option>
                <option value="proof">Force Proof</option>
              </select>

              {(events.length > 0 || finalAnswer) && (
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
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Solving…</>
                    : <><Play className="h-4 w-4" /> Generate Answer</>
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
                <p className="text-sm font-medium text-foreground/70">Ready to solve</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Enter a problem above and click Generate Answer to watch the agent reason step by step.
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

        {/* Right — Final Answer */}
        <Panel defaultSize={70} minSize={30} className="flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-border/30">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Final Answer</h3>
            {status === 'completed' && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'oklch(0.75 0.18 145 / 0.15)', color: 'oklch(0.75 0.18 145)' }}
              >
                ✓ Completed
              </span>
            )}
          </div>

          {/* Answer panel */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait">
              {!finalAnswer && isRunning && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center"
                >
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
                  <p className="text-xs text-muted-foreground mt-2">Computing final answer…</p>
                </motion.div>
              )}

              {!finalAnswer && !isRunning && status === 'idle' && (
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
                    <Cpu className="h-7 w-7" style={{ color: ACCENT, opacity: 0.5 }} />
                  </div>
                  <p className="text-sm text-muted-foreground/60">No answer generated yet</p>
                </motion.div>
              )}

              {finalAnswer && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Status header */}
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 border"
                    style={
                      status === 'completed'
                        ? { background: 'oklch(0.75 0.18 145 / 0.08)', borderColor: 'oklch(0.75 0.18 145 / 0.3)' }
                        : { background: 'oklch(0.577 0.245 27 / 0.08)', borderColor: 'oklch(0.577 0.245 27 / 0.3)' }
                    }
                  >
                    {status === 'completed'
                      ? <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.75 0.18 145)' }} />
                      : <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.78 0.18 55)' }} />
                    }
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: status === 'completed' ? 'oklch(0.75 0.18 145)' : 'oklch(0.78 0.18 55)' }}
                      >
                        {status === 'completed' ? 'Response Ready' : 'Best Attempt'}
                      </p>
                    </div>
                  </div>

                  
                  {/* History Bubbles */}
                  {history.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous Turns</h4>
                      {history.map((turn, idx) => (
                        <details key={turn.id || idx} className="group bg-black/20 border border-border/50 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                          <summary className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                            <span className="text-sm font-medium truncate pr-4 text-foreground/80">{turn.problem}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform duration-200" />
                          </summary>
                          <div className="px-4 py-3 border-t border-border/50 bg-black/40 text-sm text-foreground/70 prose prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              urlTransform={(url) => url.startsWith('data:image/') ? url : defaultUrlTransform(url)}
                            >
                              {formatText(turn.finalAnswer)}
                            </ReactMarkdown>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}

                  {/* The Final Answer Text */}
                  <div
                    className="rounded-xl p-5 border flex flex-col gap-4"
                    style={{
                      background: 'oklch(0.06 0 0)',
                      borderColor: status === 'completed' ? 'oklch(0.75 0.18 145 / 0.2)' : 'oklch(0.2 0 0)',
                    }}
                  >
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        urlTransform={(url) => url.startsWith('data:image/') ? url : defaultUrlTransform(url)}
                      >
                        {formatText(finalAnswer)}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Follow-up Section */}
                  {status === 'completed' && (
                    <div className="mt-6 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-wrap gap-2">
                        {["Can you optimize this code?","What are the edge cases?","Explain the loss function used."].map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleFollowUp(sug)}
                            className="text-xs px-3 py-1.5 rounded-full border border-[oklch(0.7_0.15_195_/_0.3)] bg-[oklch(0.7_0.15_195_/_0.1)] text-[oklch(0.7_0.15_195)] hover:bg-[oklch(0.7_0.15_195_/_0.2)] transition-colors text-left"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={followUpText}
                          onChange={e => setFollowUpText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleFollowUp(followUpText) }}
                          placeholder="Ask a follow-up question..."
                          className="w-full bg-black/40 border border-white/10 shadow-inner focus:bg-black/60 text-sm text-foreground rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-[oklch(0.7_0.15_195)] transition-colors"
                        />
                        <button
                          onClick={() => handleFollowUp(followUpText)}
                          disabled={!followUpText.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[oklch(0.7_0.15_195)] text-white hover:brightness-110 disabled:opacity-50 transition-all"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
