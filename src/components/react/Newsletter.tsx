import React, { useState } from 'react'
// Icons removed; use text and CSS-based spinner
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NewsletterProps {
  className?: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

const Newsletter: React.FC<NewsletterProps> = ({ className }) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }


    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage('Successfully subscribed! Please check your email to confirm.')
      setEmail('')
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again later.'
      )
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            disabled={status === 'loading'}
            className="w-full h-10 px-4 border border-border/60 bg-background/80 backdrop-blur-sm text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Email address"
            required
          />
          <Button
            type="submit"
            disabled={status === 'loading'}
            size="lg"
            variant="default"
            className="w-full gap-2"
          >
            {status === 'loading' ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin border-2 border-t-transparent" />
                <span>Subscribing...</span>
              </>
            ) : (
              <span>Subscribe</span>
            )}
          </Button>
        </div>
        {message && (
          <div
            className={cn(
              'mt-2',
              status === 'success'
                ? 'text-green-400'
                : 'text-primary'
            )}
            role="alert"
          >
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

export default Newsletter
