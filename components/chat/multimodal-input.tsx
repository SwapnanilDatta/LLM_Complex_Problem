'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TextareaAutosize from 'react-textarea-autosize'
import {
  Paperclip,
  Mic,
  MicOff,
  Send,
  X,
  FileText,
  Languages,
} from 'lucide-react'
import { useChatStore, Attachment, AgentMode } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

const languages = [
  // International
  { code: 'en', label: 'English', group: 'global' },
  { code: 'es', label: 'Español', group: 'global' },
  { code: 'fr', label: 'Français', group: 'global' },
  { code: 'de', label: 'Deutsch', group: 'global' },
  { code: 'zh', label: '中文', group: 'global' },
  { code: 'ja', label: '日本語', group: 'global' },
  // Indian Languages
  { code: 'hi', label: 'हिंदी', group: 'indian' },
  { code: 'bn', label: 'বাংলা', group: 'indian' },
  { code: 'te', label: 'తెలుగు', group: 'indian' },
  { code: 'mr', label: 'मराठी', group: 'indian' },
  { code: 'ta', label: 'தமிழ்', group: 'indian' },
  { code: 'gu', label: 'ગુજરાતી', group: 'indian' },
  { code: 'kn', label: 'ಕನ್ನಡ', group: 'indian' },
  { code: 'ml', label: 'മലയാളം', group: 'indian' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', group: 'indian' },
  { code: 'ur', label: 'اردو', group: 'indian' },
]

const agentColors: Record<AgentMode, string> = {
  maths: 'oklch(0.7 0.15 195)',
  ml: 'oklch(0.7 0.2 320)',
  automata: 'oklch(0.8 0.18 85)',
}

const agentPlaceholders: Record<AgentMode, string> = {
  maths: 'Ask about equations, proofs, calculus...',
  ml: 'Ask about neural networks, training, datasets...',
  automata: 'Ask about state machines, languages, Turing machines...',
}

// Simulated AI responses based on agent mode
const simulatedResponses: Record<AgentMode, string[]> = {
  maths: [
    "Let me solve this step by step.\n\nGiven the equation $$x^2 + 5x + 6 = 0$$\n\nWe can factor this as:\n$$(x + 2)(x + 3) = 0$$\n\nTherefore, the solutions are:\n$$x = -2 \\text{ or } x = -3$$",
    "Using the quadratic formula:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\nThis is one of the most fundamental formulas in algebra.",
    "The derivative of $f(x) = x^3$ is:\n\n$$f'(x) = 3x^2$$\n\nUsing the power rule: $$\\frac{d}{dx}[x^n] = nx^{n-1}$$",
  ],
  ml: [
    "Here's a simple neural network implementation:\n\n```python\nimport torch\nimport torch.nn as nn\n\nclass SimpleNN(nn.Module):\n    def __init__(self, input_size, hidden_size, output_size):\n        super(SimpleNN, self).__init__()\n        self.fc1 = nn.Linear(input_size, hidden_size)\n        self.relu = nn.ReLU()\n        self.fc2 = nn.Linear(hidden_size, output_size)\n    \n    def forward(self, x):\n        x = self.fc1(x)\n        x = self.relu(x)\n        x = self.fc2(x)\n        return x\n```\n\nThis creates a basic feedforward network with one hidden layer.",
    "The loss function for binary classification is typically **Binary Cross-Entropy**:\n\n$$\\mathcal{L} = -\\frac{1}{N}\\sum_{i=1}^{N}[y_i \\log(\\hat{y}_i) + (1-y_i)\\log(1-\\hat{y}_i)]$$",
    "For gradient descent, we update weights using:\n\n$$\\theta_{new} = \\theta_{old} - \\alpha \\nabla J(\\theta)$$\n\nWhere $\\alpha$ is the learning rate and $\\nabla J(\\theta)$ is the gradient of the cost function.",
  ],
  automata: [
    "Here's a DFA (Deterministic Finite Automaton) for accepting strings that end with '01':\n\n```mermaid\nstateDiagram-v2\n    [*] --> q0\n    q0 --> q0: 0\n    q0 --> q1: 1\n    q1 --> q0: 0\n    q1 --> q1: 1\n    q0 --> q2: 0\n    q2 --> q3: 1\n    q3 --> [*]\n```\n\nThe automaton transitions between states based on input symbols.",
    "A **Turing Machine** consists of:\n\n1. An infinite tape divided into cells\n2. A head that can read/write symbols\n3. A state register\n4. A transition function δ\n\nFormally: $$M = (Q, \\Sigma, \\Gamma, \\delta, q_0, q_{accept}, q_{reject})$$",
    "The **Pumping Lemma** for regular languages states:\n\n> For any regular language L, there exists a pumping length p such that any string s in L with |s| ≥ p can be divided into three parts, s = xyz, satisfying:\n\n1. $|y| > 0$\n2. $|xy| \\leq p$\n3. For all $i \\geq 0$, $xy^iz \\in L$",
  ],
}

export interface MultimodalInputProps {
  onSubmit?: (text: string, attachments: Attachment[]) => void;
  isLoading?: boolean;
}

export function MultimodalInput({ onSubmit, isLoading }: MultimodalInputProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  const { t, language } = useTranslation()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    activeTab,
    activeChatByAgent,
    isRecording,
    hasStartedByAgent,
    createNewChat,
    addMessage,
    setRecording,
    setHasStartedConversation,
    setLanguage,
  } = useChatStore()

  const agentMode: AgentMode = activeTab ?? 'maths'

  const activeChat = activeChatByAgent[agentMode] ?? null
  const hasStarted = hasStartedByAgent[agentMode]
  const accentColor = agentColors[agentMode]

  const hasContent = text.trim().length > 0 || attachments.length > 0

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map(file => {
      const isImage = file.type.startsWith('image/')
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: isImage ? 'image' : 'file',
        url: URL.createObjectURL(file),
        preview: isImage ? URL.createObjectURL(file) : undefined,
      }
    })

    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att?.url) URL.revokeObjectURL(att.url)
      return prev.filter(a => a.id !== id)
    })
  }, [])

  const toggleRecording = useCallback(() => {
    setRecording(!isRecording)
  }, [isRecording, setRecording])

  const handleSubmit = useCallback(async () => {
    if (!hasContent || isLoading) return

    if (onSubmit) {
      onSubmit(text, attachments)
      setText('')
      setAttachments([])
      return
    }

    let chatId = activeChat
    if (!chatId) {
      chatId = createNewChat(agentMode)
    }

    addMessage(
      chatId,
      {
        role: 'user',
        content: text,
        agentMode,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      agentMode
    )

    setText('')
    setAttachments([])
    setHasStartedConversation(true, agentMode)

    // Simulate AI response
    setTimeout(() => {
      const responses = simulatedResponses[agentMode]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      addMessage(
        chatId!,
        { role: 'assistant', content: randomResponse, agentMode },
        agentMode
      )
    }, 1500)
  }, [
    text,
    attachments,
    activeChat,
    agentMode,
    hasContent,
    addMessage,
    createNewChat,
    setHasStartedConversation,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  useEffect(() => {
    if (hasStarted && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [hasStarted, agentMode])

  return (
    <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent shrink-0">
      <div className="max-w-3xl mx-auto">
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-2"
            >
              {attachments.map(att => (
                <motion.div
                  key={att.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative group"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary border border-border">
                    {att.type === 'image' && att.preview ? (
                      <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <motion.div
          animate={{
            boxShadow: isFocused
              ? `0 0 0 2px ${accentColor.replace(')', ' / 0.35)').replace('oklch(', 'oklch(')}`
              : '0 0 0 1px oklch(0.2 0 0)',
          }}
          transition={{ duration: 0.15 }}
          className="flex items-end gap-2 p-3 bg-card rounded-2xl border border-border"
        >
          {/* Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Text Input */}
          <TextareaAutosize
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t(`input.placeholder.${agentMode}`)}
            className="flex-1 bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-6 max-h-32 py-1.5"
            minRows={1}
            maxRows={5}
          />

          {/* Voice Input Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'shrink-0 transition-colors',
              isRecording ? 'text-destructive hover:text-destructive' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={toggleRecording}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative"
                >
                  <MicOff className="h-5 w-5" />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-destructive/20 rounded-full -z-10"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="not-recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Language Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            >
              <Languages className="h-5 w-5" />
            </Button>

            <AnimatePresence>
              {isLanguageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 py-2 bg-popover border border-border rounded-lg shadow-lg min-w-40 z-50 max-h-80 overflow-y-auto"
                >
                  {/* Global Languages */}
                  <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    🌏 International
                  </div>
                  {languages.filter(l => l.group === 'global').map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setIsLanguageOpen(false)
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors',
                        language === lang.code && 'text-primary font-medium'
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                  {/* Divider */}
                  <div className="mx-3 my-1.5 h-px bg-border" />
                  {/* Indian Languages */}
                  <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    🇮🇳 Indian Languages
                  </div>
                  {languages.filter(l => l.group === 'indian').map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setIsLanguageOpen(false)
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors',
                        lang.code === 'ur' ? 'text-right' : 'text-left',
                        language === lang.code && 'text-primary font-medium'
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Button
            size="icon"
            disabled={!hasContent || isLoading}
            onClick={handleSubmit}
            className="shrink-0 transition-all"
            style={
              hasContent
                ? {
                    background: accentColor,
                    color: 'oklch(0.03 0 0)',
                    boxShadow: `0 0 16px ${accentColor.replace(')', ' / 0.4)').replace('oklch(', 'oklch(')}`,
                  }
                : {}
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-2">
          {t('ui.disclaimer')}
        </p>
      </div>
    </div>
  )
}
