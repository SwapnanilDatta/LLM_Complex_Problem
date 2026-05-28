import { create } from 'zustand'

export type AgentMode = 'maths' | 'ml' | 'automata'
export type AppView = 'home' | 'chat'

export interface Attachment {
  id?: string
  name: string
  type: 'image' | 'file' | 'audio'
  url?: string
  preview?: string
  data?: string
}

export interface NodeEvent {
  id: number
  node: string
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
  status: string
  full_update?: Record<string, unknown>
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

export interface ChatHistoryTurn {
  id: string
  problem: string
  finalAnswer: string
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  agentMode: AgentMode
  problem?: string
  status?: string
  events?: NodeEvent[]
  finalAnswer?: string
  errorMsg?: string
  attachments?: Attachment[]
  history?: ChatHistoryTurn[]
}

type ChatsByAgent = Record<AgentMode, Chat[]>
type ActiveChatByAgent = Record<AgentMode, string | null>
type HasStartedByAgent = Record<AgentMode, boolean>

interface ChatState {
  appView: AppView
  activeTab: AgentMode | null

  chatsByAgent: ChatsByAgent
  activeChatByAgent: ActiveChatByAgent
  hasStartedByAgent: HasStartedByAgent

  isSidebarOpen: boolean
  isRecording: boolean
  language: string

  get agentMode(): AgentMode

  goHome: () => void
  openAgentTab: (mode: AgentMode) => void
  setActiveTab: (mode: AgentMode) => void

  fetchChats: () => Promise<void>
  createNewChat: (mode?: AgentMode) => Promise<string>
  setActiveChat: (chatId: string | null, mode?: AgentMode) => void
  updateChatLocally: (chatId: string, updates: Partial<Chat>, mode?: AgentMode) => void
  saveChatUpdate: (chatId: string, updates: Partial<Chat>) => Promise<void>
  deleteChat: (chatId: string, mode?: AgentMode) => Promise<void>

  toggleSidebar: () => void
  setRecording: (isRecording: boolean) => void
  setLanguage: (lang: string) => void
  setAgentMode: (mode: AgentMode) => void
  
  // Legacy methods
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>, mode?: AgentMode) => void
  updateMessage: (chatId: string, messageId: string, content: string, mode?: AgentMode) => void
  setMessageStreaming: (chatId: string, messageId: string, isStreaming: boolean, mode?: AgentMode) => void
  setHasStartedConversation: (hasStarted: boolean, mode?: AgentMode) => void
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

  get agentMode() {
    return get().activeTab ?? 'maths'
  },

  goHome: () => {
    set({ appView: 'home', activeTab: null })
  },

  openAgentTab: (mode) => {
    let activeId = get().activeChatByAgent[mode]
    
    // If no active chat, try to select the first one, or create new if none exist
    if (!activeId) {
      const chats = get().chatsByAgent[mode]
      if (chats && chats.length > 0) {
        activeId = chats[0].id
        set({
          appView: 'chat',
          activeTab: mode,
          activeChatByAgent: { ...get().activeChatByAgent, [mode]: activeId },
        })
      } else {
        // We will call createNewChat which will handle it
        get().createNewChat(mode).then((newId) => {
          set({
            appView: 'chat',
            activeTab: mode,
          })
        })
        return
      }
    } else {
      set({
        appView: 'chat',
        activeTab: mode,
      })
    }
  },

  setActiveTab: (mode) => {
    set({ activeTab: mode, appView: 'chat' })
  },

  fetchChats: async () => {
    try {
      const res = await fetch('/api/chats')
      if (res.ok) {
        const data = await res.json()
        const chats = data.chats as Chat[]
        
        const newChatsByAgent = { maths: [] as Chat[], ml: [] as Chat[], automata: [] as Chat[] }
        chats.forEach(chat => {
          chat.id = (chat as any)._id
          if (newChatsByAgent[chat.agentMode]) {
            newChatsByAgent[chat.agentMode].push(chat)
          }
        })
        
        set({ chatsByAgent: newChatsByAgent })
      }
    } catch (e) {
      console.error('Failed to fetch chats', e)
    }
  },

  createNewChat: async (mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    
    // Optimistic UI
    const tempId = crypto.randomUUID()
    const newChat: Chat = {
      id: tempId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      agentMode,
      problem: '',
      status: 'idle',
      events: [],
      finalAnswer: '',
      errorMsg: '',
      attachments: [],
      history: []
    }

    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: [newChat, ...state.chatsByAgent[agentMode]],
      },
      activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: newChat.id },
      hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: false },
      appView: 'chat',
      activeTab: agentMode,
    }))

    // API call
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentMode, title: 'New Chat' })
      })
      if (res.ok) {
        const data = await res.json()
        const dbChat = data.chat
        dbChat.id = dbChat._id
        
        set(state => {
          const modeChats = state.chatsByAgent[agentMode].map(c => 
            c.id === tempId ? dbChat : c
          )
          const newActiveChat = state.activeChatByAgent[agentMode] === tempId ? dbChat.id : state.activeChatByAgent[agentMode]
          
          return {
            chatsByAgent: { ...state.chatsByAgent, [agentMode]: modeChats },
            activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: newActiveChat }
          }
        })
        return dbChat.id
      }
    } catch (e) {
      console.error('Failed to create chat on server', e)
    }
    return tempId
  },

  setActiveChat: (chatId, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    const chats = get().chatsByAgent[agentMode]
    const chat = chats.find(c => c.id === chatId)
    
    // Determine if started based on problem or events
    const hasStarted = chat ? (!!chat.problem || (chat.events && chat.events.length > 0)) : false

    set(state => ({
      activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: chatId },
      hasStartedByAgent: {
        ...state.hasStartedByAgent,
        [agentMode]: hasStarted,
      },
    }))
  },

  updateChatLocally: (chatId, updates, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => {
      const chats = state.chatsByAgent[agentMode]
      const chatIndex = chats.findIndex(c => c.id === chatId)
      if (chatIndex === -1) return state

      const updatedChat = { ...chats[chatIndex], ...updates, updatedAt: new Date() }
      const newChats = [...chats]
      newChats[chatIndex] = updatedChat
      
      const hasStarted = !!updatedChat.problem || (updatedChat.events && updatedChat.events.length > 0)

      return {
        chatsByAgent: { ...state.chatsByAgent, [agentMode]: newChats },
        hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: hasStarted }
      }
    })
  },

  saveChatUpdate: async (chatId, updates) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (e) {
      console.error('Failed to update chat on server', e)
    }
  },

  deleteChat: async (chatId, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    
    // Optimistic UI update
    set(state => {
      const newChats = state.chatsByAgent[agentMode].filter(c => c.id !== chatId)
      const currentActive = state.activeChatByAgent[agentMode]
      const newActive = currentActive === chatId ? (newChats[0]?.id ?? null) : currentActive
      
      const activeChatObj = newChats.find(c => c.id === newActive)
      const hasStarted = activeChatObj ? (!!activeChatObj.problem || (activeChatObj.events && activeChatObj.events.length > 0)) : false

      return {
        chatsByAgent: { ...state.chatsByAgent, [agentMode]: newChats },
        activeChatByAgent: { ...state.activeChatByAgent, [agentMode]: newActive },
        hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: hasStarted },
      }
    })

    // Server deletion
    try {
      await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete chat', e)
    }
  },

  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setRecording: (isRecording) => set({ isRecording }),
  setLanguage: (language) => set({ language }),

  setAgentMode: (mode) => {
    set({ activeTab: mode })
  },
  
  // Legacy message methods
  addMessage: (chatId, message, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    const newMessage: Message = { ...message, id: crypto.randomUUID(), timestamp: new Date() }
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: state.chatsByAgent[agentMode].map(chat => {
          if (chat.id !== chatId) return chat
          return { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date() }
        })
      }
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
            messages: chat.messages.map(msg => msg.id === messageId ? { ...msg, content } : msg),
            updatedAt: new Date()
          }
        })
      }
    }))
  },
  setMessageStreaming: (chatId, messageId, isStreaming, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => ({
      chatsByAgent: {
        ...state.chatsByAgent,
        [agentMode]: state.chatsByAgent[agentMode].map(chat => {
          if (chat.id !== chatId) return chat
          return { ...chat, messages: chat.messages.map(msg => msg.id === messageId ? { ...msg, isStreaming } : msg) }
        })
      }
    }))
  },
  setHasStartedConversation: (hasStarted, mode) => {
    const agentMode = mode ?? get().activeTab ?? 'maths'
    set(state => ({ hasStartedByAgent: { ...state.hasStartedByAgent, [agentMode]: hasStarted } }))
  }
}))
