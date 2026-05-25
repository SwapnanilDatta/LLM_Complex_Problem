'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore, AgentMode } from '@/lib/store'
import { MessageBubble } from './message-bubble'
import { MathsAgentChat } from './maths-agent-chat'
import { MlAgentChat } from './ml-agent-chat'
import { AutomataAgentChat } from './automata-agent-chat'
import { Loader2, Cpu, GitMerge } from 'lucide-react'

const agentColors: Record<AgentMode, string> = {
  maths: 'oklch(0.7 0.15 195)',
  ml: 'oklch(0.7 0.2 320)',
  automata: 'oklch(0.8 0.18 85)',
}

const agentEmptyMessages: Record<AgentMode, { title: string; subtitle: string }> = {
  maths: {
    title: 'Mathematics Agent',
    subtitle: 'Enter a problem above and click Generate Proof.',
  },
  ml: {
    title: 'Machine Learning Agent',
    subtitle: 'Ask about neural networks, training, datasets, or ML theory.',
  },
  automata: {
    title: 'Automata Theory Agent',
    subtitle: 'Ask about state machines, formal languages, or Turing machines.',
  },
}

export function ChatArea() {
  const { chatsByAgent, activeChatByAgent, activeTab, hasStartedByAgent } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const agentMode = activeTab ?? 'maths'
  const activeChat = activeChatByAgent[agentMode]
  const currentChat = chatsByAgent[agentMode]?.find(c => c.id === activeChat)
  const messages = currentChat?.messages ?? []
  const hasStarted = hasStartedByAgent[agentMode]
  const isWaitingForResponse = messages.length > 0 && messages[messages.length - 1].role === 'user'
  const accentColor = agentColors[agentMode]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Maths tab → render the specialised LangGraph UI ──────────────────────
  if (agentMode === 'maths') {
    return <MathsAgentChat />
  }

  // ── ML tab → render the specialised LangGraph UI ─────────────────────────
  if (agentMode === 'ml') {
    return <MlAgentChat />
  }

  // ── Automata tab → render the specialised LangGraph UI ────────────────────
  if (agentMode === 'automata') {
    return <AutomataAgentChat />
  }

  return null
}
