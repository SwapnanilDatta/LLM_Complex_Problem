import { create } from 'zustand'

export type AgentMode = 'maths' | 'ml' | 'automata'
export type AppView = 'home' | 'chat'

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'file' | 'audio'
  url: string
  preview?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  agentMode?: AgentMode
  attachments?: Attachment[]
  isStreaming?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  agentMode: AgentMode
}

type ChatsByAgent = Record<AgentMode, Chat[]>
type ActiveChatByAgent = Record<AgentMode, string | null>
type HasStartedByAgent = Record<AgentMode, boolean>

interface ChatState {
  // View routing
  appView: AppView
  activeTab: AgentMode | null

  // Per-agent state
  chatsByAgent: ChatsByAgent
  activeChatByAgent: ActiveChatByAgent
  hasStartedByAgent: HasStartedByAgent

  // Global UI
  isSidebarOpen: boolean
  isRecording: boolean
  language: string

  // Derived getters (computed from activeTab)
  agentMode: AgentMode

  // Actions
  goHome: () => void
  openAgentTab: (mode: AgentMode) => void
  setActiveTab: (mode: AgentMode) => void

  createNewChat: (mode?: AgentMode) => string
  setActiveChat: (chatId: string | null, mode?: AgentMode) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>, mode?: AgentMode) => void
  updateMessage: (chatId: string, messageId: string, content: string, mode?: AgentMode) => void
  setMessageStreaming: (chatId: string, messageId: string, isStreaming: boolean, mode?: AgentMode) => void
  setHasStartedConversation: (hasStarted: boolean, mode?: AgentMode) => void
  deleteChat: (chatId: string, mode?: AgentMode) => void

  toggleSidebar: () => void
  setRecording: (isRecording: boolean) => void
  setLanguage: (lang: string) => void

  // Legacy compat helpers
  setAgentMode: (mode: AgentMode) => void
}

const defaultChatsByAgent: ChatsByAgent = { maths: [], ml: [], automata: [] }
const defaultActiveChatByAgent: ActiveChatByAgent = { maths: null, ml: null, automata: null }
const defaultHasStartedByAgent: HasStartedByAgent = { maths: false, ml: false, automata: false }

export const useChatStore = create<ChatState>((set, get) => ({
  appView: 'home',
  activeTab: null,
  chatsByAgent: defaultChatsByAgent,
  activeChatByAgent: defaultActiveChatByAgent,
  hasStartedByAgent: defaultHasStartedByAgent,
  isSidebarOpen: true,
  isRecording: false,
  language: 'en',

  // Derived: current agent mode = activeTab or 'maths' fallback
  get agentMode() {
    return get().activeTab ?? 'maths'
  },

  goHome: () => {
    set({ appView: 'home', activeTab: null })
  },

  openAgentTab: (mode) => {
    // Always open a fresh new chat for this agent
    const newChatId = get().createNewChat(mode)
    set({
      appView: 'chat',
      activeTab: mode,
      activeChatByAgent: { ...get().activeChatByAgent, [mode]: newChatId },
      hasStartedByAgent: { ...get().hasStartedByAgent, [mode]: false },
    })
  },

  setActiveTab: (mode) => {
    set({ activeTab: mode, appView: 'chat' })
  },

  createNewChat: (mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      agentMode,
    }
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: [newChat, ...state.chatsByAgent[agentMode]],
      },
      activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: newChat.id },
      hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: false },
    }))
    return newChat.id
  },

  setActiveChat: (chatId, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    const chats = get().chatsByAgent[agentMode]
    const chat = chats.find(c => c.id === chatId)
    set(state => ({
      activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: chatId },
      hasStartedByAgent: {
        ...state.hasStartedByAgent,
        [agentMode]: chat ? chat.messages.length > 0 : false,
      },
    }))
  },

  addMessage: (chatId, message, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: state.chatsByAgent[agentMode].map(chat => {
          if (chat.id !== chatId) return chat
          const updatedMessages = [...chat.messages, newMessage]
          const title =
            chat.title === 'New Chat' && message.role === 'user'
              ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
              : chat.title
          return { ...chat, messages: updatedMessages, title, updatedAt: new Date() }
        }),
      },
      hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: true },
    }))
  },

  updateMessage: (chatId, messageId, content, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: state.chatsByAgent[agentMode].map(chat => {
          if (chat.id !== chatId) return chat
          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date(),
          }
        }),
      },
    }))
  },

  setMessageStreaming: (chatId, messageId, isStreaming, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: state.chatsByAgent[agentMode].map(chat => {
          if (chat.id !== chatId) return chat
          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId ? { ...msg, isStreaming } : msg
            ),
          }
        }),
      },
    }))
  },

  setHasStartedConversation: (hasStarted, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => ({
      hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: hasStarted },
    }))
  },

  deleteChat: (chatId, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => {
      const newChats = state.chatsByAgent[agentMode].filter(c => c.id !== chatId)
      const currentActive = state.activeChatByAgent[agentMode]
      const newActive = currentActive === chatId ? (newChats[0]?.id ?? null) : currentActive
      return {
        chatsByAgent: { ...state.chatsByAgent, [agentMode]: newChats },
        activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: newActive },
        hasStartedByAgent: {
          ...state.hasStartedByAgent,
          [agentMode]: newActive
            ? (newChats.find(c => c.id === newActive)?.messages.length ?? 0) > 0
            : false,
        },
      }
    })
  },

  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setRecording: (isRecording) => set({ isRecording }),
  setLanguage: (language) => set({ language }),

  // Legacy compat
  setAgentMode: (mode) => {
    set({ activeTab: mode })
  },
}))
