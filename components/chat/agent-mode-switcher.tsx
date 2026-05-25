'use client'

import { motion } from 'framer-motion'
import { Sigma, Cpu, GitMerge } from 'lucide-react'
import { useChatStore, AgentMode } from '@/lib/store'
import { cn } from '@/lib/utils'

const modes: { id: AgentMode; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'maths', label: 'Maths', icon: Sigma, color: 'bg-agent-maths' },
  { id: 'ml', label: 'ML', icon: Cpu, color: 'bg-agent-ml' },
  { id: 'automata', label: 'Automata', icon: GitMerge, color: 'bg-agent-automata' },
]

export function AgentModeSwitcher() {
  const { agentMode, setAgentMode } = useChatStore()

  return (
    <div className="relative flex items-center gap-1 p-1 bg-secondary/50 backdrop-blur-sm rounded-full border border-border/50">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = agentMode === mode.id

        return (
          <button
            key={mode.id}
            onClick={() => setAgentMode(mode.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors z-10',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="agent-mode-pill"
                className={cn('absolute inset-0 rounded-full', mode.color)}
                style={{
                  boxShadow: `0 0 20px ${mode.id === 'maths' ? 'oklch(0.7 0.15 195 / 0.4)' : mode.id === 'ml' ? 'oklch(0.7 0.2 320 / 0.4)' : 'oklch(0.8 0.18 85 / 0.4)'}`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn('h-4 w-4 relative z-10', isActive && 'text-primary-foreground')} />
            <span className="relative z-10 hidden sm:inline">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
