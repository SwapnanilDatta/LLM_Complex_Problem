'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, Menu, X, ChevronDown } from 'lucide-react'
import { useChatStore, AgentMode } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

function groupChatsByDate(chats: { id: string; title: string; updatedAt: Date }[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups: { label: string; chats: typeof chats }[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 Days', chats: [] },
    { label: 'Older', chats: [] },
  ]

  chats.forEach(chat => {
    const chatDate = new Date(chat.updatedAt)
    if (chatDate >= today) {
      groups[0].chats.push(chat)
    } else if (chatDate >= yesterday) {
      groups[1].chats.push(chat)
    } else if (chatDate >= weekAgo) {
      groups[2].chats.push(chat)
    } else {
      groups[3].chats.push(chat)
    }
  })

  return groups.filter(g => g.chats.length > 0)
}

const agentTheme: Record<AgentMode, { accent: string; pill: string; label: string }> = {
  maths: {
    accent: 'oklch(0.7 0.15 195)',
    pill: 'bg-[oklch(0.7_0.15_195_/_0.15)] text-[oklch(0.7_0.15_195)] border-[oklch(0.7_0.15_195_/_0.3)]',
    label: 'Mathematics',
  },
  ml: {
    accent: 'oklch(0.7 0.2 320)',
    pill: 'bg-[oklch(0.7_0.2_320_/_0.15)] text-[oklch(0.7_0.2_320)] border-[oklch(0.7_0.2_320_/_0.3)]',
    label: 'Machine Learning',
  },
  automata: {
    accent: 'oklch(0.8 0.18 85)',
    pill: 'bg-[oklch(0.8_0.18_85_/_0.15)] text-[oklch(0.8_0.18_85)] border-[oklch(0.8_0.18_85_/_0.3)]',
    label: 'Automata Theory',
  },
}

export function Sidebar() {
  const {
    chatsByAgent,
    activeChatByAgent,
    activeTab,
    isSidebarOpen,
    createNewChat,
    setActiveChat,
    toggleSidebar,
    deleteChat,
    openAgentTab,
  } = useChatStore()

  const agentMode = activeTab ?? 'maths'
  const theme = agentTheme[agentMode]
  const chats = chatsByAgent[agentMode] ?? []
  const activeChat = activeChatByAgent[agentMode] ?? null

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats])

  const handleNewChat = () => {
    openAgentTab(agentMode)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar toggle button for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 260 : 0,
          opacity: isSidebarOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative h-full bg-sidebar border-r z-50 overflow-hidden flex flex-col shrink-0',
          !isSidebarOpen && 'md:w-0'
        )}
        style={{
          borderColor: isSidebarOpen ? `${theme.accent}30` : 'transparent',
          transition: 'border-color 0.3s ease',
        }}
      >
        <div className="flex flex-col h-full w-[260px]">
          {/* Agent badge + New Chat */}
          <div className="p-4 space-y-3">
            {/* Agent badge */}
            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold', theme.pill)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {theme.label}
            </div>

            {/* New Chat button */}
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 font-medium text-sm transition-all hover:brightness-125"
              style={{
                background: theme.accent.replace(')', ' / 0.15)'),
                color: theme.accent,
                border: `1px solid ${theme.accent.replace(')', ' / 0.3)')}`,
              }}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Separator */}
          <div className="mx-4 h-px mb-1" style={{ background: theme.accent.replace(')', ' / 0.2)') }} />

          {/* Chat History Label */}
          <div className="px-4 py-2 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {groupedChats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-10 text-center"
              >
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground/60">No conversations yet</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Start a new chat to begin</p>
              </motion.div>
            ) : (
              groupedChats.map(group => (
                <div key={group.label} className="mb-4">
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.chats.map(chat => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveChat(chat.id, agentMode)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setActiveChat(chat.id, agentMode)
                        }
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5 cursor-pointer',
                        activeChat === chat.id
                          ? 'font-medium'
                          : 'text-sidebar-foreground hover:bg-white/5'
                      )}
                      style={
                        activeChat === chat.id
                          ? { 
                              background: theme.accent.replace(')', ' / 0.15)'),
                              color: theme.accent,
                              boxShadow: `inset 3px 0 0 ${theme.accent}` 
                            }
                          : {}
                      }
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1 text-sm">{chat.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteChat(chat.id, agentMode)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.aside>

      {/* Desktop toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex fixed top-[3.75rem] left-3 z-30 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={toggleSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  )
}
