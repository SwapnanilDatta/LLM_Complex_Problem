import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.MATHS_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://swapnanildatta-finalyear.hf.space' : 'http://127.0.0.1:8000')

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const upstream = await fetch(`${BACKEND_URL}/api/automata/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Backend returned ${upstream.status}` }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the SSE response straight through to the browser
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Could not reach Automata backend: ${message}` }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
