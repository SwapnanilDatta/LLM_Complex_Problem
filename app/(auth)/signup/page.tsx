'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/auth-store'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { checkAuth } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      await checkAuth()
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background px-4 py-24">
      {/* Animated background orbs matching WelcomeScreen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'oklch(0.7 0.15 195 / 0.3)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'oklch(0.7 0.2 320 / 0.25)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-[oklch(0.7_0.2_320_/_0.3)] bg-background/60 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, oklch(0.7 0.15 195 / 0.2), oklch(0.7 0.2 320 / 0.2))',
              border: '1px solid oklch(0.7 0.2 320 / 0.3)',
              boxShadow: '0 0 40px oklch(0.7 0.2 320 / 0.2)',
            }}
          >
            <Image src="/logo.jpeg" alt="SolveX Logo" width={64} height={64} className="w-full h-full object-cover" priority />
          </motion.div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[oklch(0.7_0.2_320)]" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
            <Sparkles className="h-4 w-4 text-[oklch(0.7_0.2_320)]" />
          </div>
          <p className="text-sm text-muted-foreground">Join SolveX to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background/50 border-[oklch(0.7_0.2_320_/_0.2)] focus-visible:ring-[oklch(0.7_0.2_320)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-[oklch(0.7_0.2_320_/_0.2)] focus-visible:ring-[oklch(0.7_0.2_320)]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-[oklch(0.7_0.2_320_/_0.2)] focus-visible:ring-[oklch(0.7_0.2_320)]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 bg-[oklch(0.7_0.2_320)] hover:bg-[oklch(0.6_0.2_320)] text-white group"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-[oklch(0.7_0.2_320)] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
