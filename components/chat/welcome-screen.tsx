'use client'

import { motion } from 'framer-motion'
import { Sigma, Cpu, GitMerge, Sparkles, ArrowRight, Brain } from 'lucide-react'
import { useChatStore, AgentMode } from '@/lib/store'
import { cn } from '@/lib/utils'

const agentCards: {
  id: AgentMode
  title: string
  shortTitle: string
  description: string
  icon: React.ElementType
  gradient: string
  borderColor: string
  glowColor: string
  accentColor: string
  features: string[]
}[] = [
  {
    id: 'maths',
    title: 'Mathematics',
    shortTitle: 'Maths',
    description: 'Solve complex equations, prove theorems, and explore mathematical concepts with full LaTeX rendering.',
    icon: Sigma,
    gradient: 'from-[oklch(0.7_0.15_195_/_0.15)] via-[oklch(0.7_0.15_195_/_0.05)] to-transparent',
    borderColor: 'border-[oklch(0.7_0.15_195_/_0.3)] hover:border-[oklch(0.7_0.15_195_/_0.7)]',
    glowColor: 'oklch(0.7_0.15_195_/_0.25)',
    accentColor: 'text-[oklch(0.7_0.15_195)]',
    features: ['LaTeX Rendering', 'Step-by-step Proofs', 'Calculus & Algebra'],
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    shortTitle: 'ML',
    description: 'Build models, analyze datasets, and understand ML algorithms with code examples and visualizations.',
    icon: Cpu,
    gradient: 'from-[oklch(0.7_0.2_320_/_0.15)] via-[oklch(0.7_0.2_320_/_0.05)] to-transparent',
    borderColor: 'border-[oklch(0.7_0.2_320_/_0.3)] hover:border-[oklch(0.7_0.2_320_/_0.7)]',
    glowColor: 'oklch(0.7_0.2_320_/_0.25)',
    accentColor: 'text-[oklch(0.7_0.2_320)]',
    features: ['Code Examples', 'Neural Networks', 'Data Analysis'],
  },
  {
    id: 'automata',
    title: 'Automata Theory',
    shortTitle: 'Automata',
    description: 'Design state machines, analyze formal languages, and visualize automata with interactive diagrams.',
    icon: GitMerge,
    gradient: 'from-[oklch(0.8_0.18_85_/_0.15)] via-[oklch(0.8_0.18_85_/_0.05)] to-transparent',
    borderColor: 'border-[oklch(0.8_0.18_85_/_0.3)] hover:border-[oklch(0.8_0.18_85_/_0.7)]',
    glowColor: 'oklch(0.8_0.18_85_/_0.25)',
    accentColor: 'text-[oklch(0.8_0.18_85)]',
    features: ['State Diagrams', 'Turing Machines', 'Formal Languages'],
  },
]

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const cardVariants: any = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
}

export function WelcomeScreen() {
  const { openAgentTab } = useChatStore()

  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-y-auto overflow-x-hidden bg-background px-4 py-24">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'oklch(0.7 0.15 195 / 0.3)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'oklch(0.7 0.2 320 / 0.25)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.18, 0.08],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'oklch(0.8 0.18 85 / 0.2)' }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center mb-14 z-10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, oklch(0.7 0.15 195 / 0.2), oklch(0.7 0.2 320 / 0.2))',
            border: '1px solid oklch(0.7 0.15 195 / 0.3)',
            boxShadow: '0 0 40px oklch(0.7 0.15 195 / 0.2)',
          }}
        >
          <Brain className="h-10 w-10 text-[oklch(0.7_0.15_195)]" />
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[oklch(0.7_0.15_195)]" />
          <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            AI-Powered Learning
          </span>
          <Sparkles className="h-4 w-4 text-[oklch(0.7_0.15_195)]" />
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5">
          <span className="text-foreground">Nexus</span>{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, oklch(0.7 0.15 195), oklch(0.7 0.2 320), oklch(0.8 0.18 85))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your specialized AI companion for advanced academics.{' '}
          <span className="text-foreground/70">Choose your domain to begin.</span>
        </p>
      </motion.div>

      {/* Agent Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl z-10"
      >
        {agentCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.id}
              variants={cardVariants}
              whileHover={{
                scale: 1.03,
                y: -6,
                boxShadow: `0 24px 48px ${card.glowColor}, 0 0 0 1px ${card.glowColor}`,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAgentTab(card.id)}
              className={cn(
                'relative flex flex-col items-start p-7 rounded-2xl text-left border transition-all duration-300 overflow-hidden group',
                'bg-gradient-to-br',
                card.gradient,
                card.borderColor
              )}
              style={{
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${card.glowColor}, transparent)`,
                  border: `1px solid ${card.glowColor}`,
                  boxShadow: `0 0 20px ${card.glowColor}`,
                }}
              >
                <Icon className={cn('h-7 w-7', card.accentColor)} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{card.description}</p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {card.features.map((feature) => (
                  <span
                    key={feature}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium',
                      card.accentColor
                    )}
                    style={{ background: `${card.glowColor}` }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-2 text-sm font-semibold transition-all duration-200',
                  card.accentColor,
                  'group-hover:gap-3'
                )}
              >
                Start chatting
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>

              {/* Corner glow on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -z-10 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${card.glowColor}, transparent 70%)` }}
              />
            </motion.button>
          )
        })}
      </motion.div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-12 text-xs text-muted-foreground/60 text-center"
      >
        Each agent has its own specialized knowledge base and conversation history.
      </motion.p>
    </div>
  )
}
