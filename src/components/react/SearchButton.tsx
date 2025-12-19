import React, { useState, useEffect } from 'react'
// Search icon removed — use text label instead
import { Button } from '@/components/ui/button'
import SearchDialog from './SearchDialog'
import { ErrorBoundary } from './ErrorBoundary'

const SearchButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInput) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 px-3 border"
        title="Search (⌘K)"
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span>Search</span>
      </Button>
      <ErrorBoundary>
        <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
      </ErrorBoundary>
    </ErrorBoundary>
  )
}

export default SearchButton

