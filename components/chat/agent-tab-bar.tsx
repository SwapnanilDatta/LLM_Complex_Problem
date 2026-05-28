'use client'

import { motion } from 'framer-motion'
import { Sigma, Cpu, GitMerge, Home } from 'lucide-react'
import { useChatStore, AgentMode } from '@/lib/store'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const tabs: {
  id: AgentMode
  label: string
  icon: React.ElementType
  color: string
  glow: string
  textColor: string
}[] = [
  {
    id: 'maths',
    label: 'Mathematics',
    icon: Sigma,
    color: 'bg-agent-maths',
    glow: 'shadow-[0_0_20px_oklch(0.7_0.15_195_/_0.5)]',
    textColor: 'text-[oklch(0.7_0.15_195)]',
  },
  {
    id: 'ml',
    label: 'Machine Learning',
    icon: Cpu,
    color: 'bg-agent-ml',
    glow: 'shadow-[0_0_20px_oklch(0.7_0.2_320_/_0.5)]',
    textColor: 'text-[oklch(0.7_0.2_320)]',
  },
  {
    id: 'automata',
    label: 'Automata Theory',
    icon: GitMerge,
    color: 'bg-agent-automata',
    glow: 'shadow-[0_0_20px_oklch(0.8_0.18_85_/_0.5)]',
    textColor: 'text-[oklch(0.8_0.18_85)]',
  },
]

export function AgentTabBar() {
  const { activeTab, setActiveTab, openAgentTab, goHome } = useChatStore()

  return (
    <div className="relative flex items-center gap-1 px-2 h-14 bg-sidebar border-b border-sidebar-border shrink-0 z-20">
      {/* Home button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={goHome}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors mr-2 shrink-0"
        title="Main Menu"
      >
        <Home className="h-4 w-4" />
      </motion.button>

      {/* Divider */}
      <div className="w-px h-6 bg-sidebar-border mr-2 shrink-0" />

      {/* Agent Tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isActive) return
                openAgentTab(tab.id)
              }}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 group',
                isActive
                  ? 'text-foreground bg-sidebar-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="tab-active-bg"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <Icon
                className={cn(
                  'h-4 w-4 relative z-10 transition-colors',
                  isActive ? tab.textColor : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>

              {/* Bottom glow bar for active */}
              {isActive && (
                <motion.div
                  layoutId="tab-active-bar"
                  className={cn('absolute bottom-0 left-3 right-3 h-0.5 rounded-full', tab.color)}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Right: SolveX logo */}
      <div className="hidden lg:flex items-center gap-2 ml-auto pl-4 shrink-0">
        <Image
          src="/logo.jpeg"
          alt="SolveX"
          width={28}
          height={28}
          className="rounded-md object-contain"
        />
        <span className="text-sm font-bold tracking-wide text-foreground">SolveX</span>
      </div>
    </div>
  )
}
