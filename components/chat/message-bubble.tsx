'use client'

import { motion } from 'framer-motion'
import { Copy, Check, User, Bot, Sigma, Cpu, GitMerge } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import mermaid from 'mermaid'
import { Message, AgentMode } from '@/lib/store'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

// Initialize mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#0ea5e9',
      primaryTextColor: '#fff',
      primaryBorderColor: '#333',
      lineColor: '#666',
      secondaryColor: '#1f2937',
      tertiaryColor: '#111827',
    },
  })
}

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    const renderChart = async () => {
      if (ref.current) {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
          const { svg } = await mermaid.render(id, chart)
          setSvg(svg)
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          setSvg(`<pre class="text-red-400">Error rendering diagram</pre>`)
        }
      }
    }
    renderChart()
  }, [chart])

  return (
    <div
      ref={ref}
      className="my-4 p-4 bg-secondary/30 rounded-lg overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function CodeBlock({ 
  language, 
  value 
}: { 
  language: string | undefined
  value: string 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle mermaid diagrams
  if (language === 'mermaid') {
    return <MermaidDiagram chart={value} />
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-border/30">
        <span className="text-xs text-muted-foreground font-mono">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#1e1e1e',
          fontSize: '0.875rem',
        }}
        showLineNumbers
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: '#4b5563',
          userSelect: 'none',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

const agentIcons: Record<AgentMode, React.ElementType> = {
  maths: Sigma,
  ml: Cpu,
  automata: GitMerge,
}

const agentColors: Record<AgentMode, string> = {
  maths: 'text-agent-maths bg-agent-maths/10',
  ml: 'text-agent-ml bg-agent-ml/10',
  automata: 'text-agent-automata bg-agent-automata/10',
}

interface MessageBubbleProps {
  message: Message
  agentMode: AgentMode
}

export function MessageBubble({ message, agentMode }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const AgentIcon = agentIcons[message.agentMode || agentMode]

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-4"
      >
        <div className="px-4 py-2 bg-secondary/50 rounded-full text-sm text-muted-foreground border border-border/50">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-3 mb-6', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-secondary' : agentColors[message.agentMode || agentMode]
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-foreground" />
        ) : (
          <AgentIcon className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'max-w-[80%] md:max-w-[70%]',
        isUser ? 'text-right' : 'text-left'
      )}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn('flex flex-wrap gap-2 mb-2', isUser && 'justify-end')}>
            {message.attachments.map(att => (
              <div
                key={att.id}
                className="w-20 h-20 rounded-lg overflow-hidden bg-secondary"
              >
                {att.type === 'image' && att.preview && (
                  <img
                    src={att.preview}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className={cn(
          'rounded-2xl px-4 py-3',
          isUser 
            ? 'bg-secondary text-foreground rounded-br-md' 
            : 'bg-transparent text-foreground'
        )}>
          {message.isStreaming ? (
            <StreamingText content={message.content} />
          ) : (
            <div className={cn('prose prose-invert max-w-none', isUser && 'prose-sm')}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match
                    
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 bg-secondary rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    }

                    return (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, '')}
                      />
                    )
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    )
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-border">
                          {children}
                        </table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return (
                      <th className="border border-border bg-secondary px-3 py-2 text-left font-semibold">
                        {children}
                      </th>
                    )
                  },
                  td({ children }) {
                    return (
                      <td className="border border-border px-3 py-2">
                        {children}
                      </td>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StreamingText({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-2 h-5 bg-primary ml-0.5 align-middle"
      />
    </div>
  )
}
