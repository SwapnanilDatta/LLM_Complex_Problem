'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './sidebar'
import { ChatArea } from './chat-area'
import { MultimodalInput } from './multimodal-input'
import { WelcomeScreen } from './welcome-screen'
import { AgentTabBar } from './agent-tab-bar'
import { useChatStore } from '@/lib/store'

export function ChatLayout() {
  const { appView, activeTab, isSidebarOpen } = useChatStore()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {appView === 'home' ? (
          /* ── MAIN MENU ── */
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <WelcomeScreen />
          </motion.div>
        ) : (
          /* ── CHAT INTERFACE ── */
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col w-full h-full"
          >
            {/* Top Tab Bar */}
            <AgentTabBar />

            {/* Content row: sidebar + main */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <Sidebar />

              {/* Main chat column */}
              <main className="flex-1 flex flex-col h-full overflow-hidden">
                <ChatArea />
                {activeTab !== 'maths' && activeTab !== 'ml' && activeTab !== 'automata' && <MultimodalInput />}
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
