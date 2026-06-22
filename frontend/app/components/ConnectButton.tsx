'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ConnectButtonProps {
  repo: {
    githubId: number
    name: string
    fullName: string
    private: boolean
  }
}

export function ConnectButton({ repo }: ConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:5000/api/repositories/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubId: repo.githubId,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private
        })
      })
      if (!res.ok) throw new Error('Failed to connect')
      setConnected(true)
    } catch (err) {
      setError('Failed to connect repository')
    } finally {
      setLoading(false)
    }
  }

  if (connected) return (
    <span className="text-xs text-green-400 font-medium">✓ Connected</span>
  )

  return (
    <div className="flex flex-col gap-1">
      <Button 
        size="sm" 
        onClick={handleConnect} 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Connecting...' : 'Connect'}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
