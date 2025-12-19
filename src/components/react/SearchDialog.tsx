import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Index } from 'flexsearch'
import { FiX } from 'react-icons/fi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PERFORMANCE } from '@/lib/constants'

interface SearchResult {
  id: string
  title: string
  description: string
  date: string
  tags: string[]
  authors: string[]
  url: string
  content: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// LocalStorage keys
const STORAGE_KEYS = {
  SEARCH_INDEX: 'search_index',
  SEARCH_INDEX_VERSION: 'search_index_version',
} as const

// Cache version - increment when index structure changes
const INDEX_VERSION = '3.0'

// Calculate relevance score
function calculateRelevanceScore(
  result: SearchResult,
  _query: string,
  queryLower: string,
): number {
  let score = 0
  const titleLower = result.title.toLowerCase()
  const descLower = result.description.toLowerCase()
  const contentLower = result.content.toLowerCase()
  const tagsLower = (result.tags || []).join(' ').toLowerCase()

  // Exact title match (highest priority)
  if (titleLower === queryLower) {
    score += 1000
  } else if (titleLower.startsWith(queryLower)) {
    score += 500
  } else if (titleLower.includes(queryLower)) {
    score += 300
  }

  // Title word matches
  const titleWords = titleLower.split(/\s+/)
  const queryWords = queryLower.split(/\s+/)
  queryWords.forEach((qWord) => {
    titleWords.forEach((tWord) => {
      if (tWord === qWord) score += 50
      else if (tWord.startsWith(qWord)) score += 30
      else if (tWord.includes(qWord)) score += 10
    })
  })

  // Description match
  if (descLower.includes(queryLower)) {
    score += 100
  }
  queryWords.forEach((qWord) => {
    if (descLower.includes(qWord)) score += 20
  })

  // Tag matches
  queryWords.forEach((qWord) => {
    if (tagsLower.includes(qWord)) score += 40
  })

  // Content match (lower priority)
  if (contentLower.includes(queryLower)) {
    score += 10
  }
  queryWords.forEach((qWord) => {
    const matches = (contentLower.match(new RegExp(qWord, 'g')) || []).length
    score += matches * 2
  })

  // Recency boost (newer posts get slight boost)
  try {
    const postDate = new Date(result.date)
    const now = new Date()
    const daysSince = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 30) score += 5
    else if (daysSince < 90) score += 2
  } catch {
    // Ignore date errors
  }

  return score
}

// Get cached search index
function getCachedIndex(): { data: SearchResult[]; version: string } | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX)
    const version = localStorage.getItem(STORAGE_KEYS.SEARCH_INDEX_VERSION)
    if (cached && version === INDEX_VERSION) {
      return { data: JSON.parse(cached), version }
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Cache search index
function cacheIndex(data: SearchResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX, JSON.stringify(data))
    localStorage.setItem(STORAGE_KEYS.SEARCH_INDEX_VERSION, INDEX_VERSION)
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingIndex, setIsLoadingIndex] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
  const [index, setIndex] = useState<Index | null>(null)
  const [displayedResults, setDisplayedResults] = useState(10)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const listboxId = 'search-results-listbox'

  // Load search index (with caching)
  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadSearchIndex = async () => {
      // Check cache first
      const cached = getCachedIndex()
      if (cached && cached.data.length > 0) {
        setSearchIndex(cached.data)
        setIsLoadingIndex(false)

        // Create FlexSearch index from cached data
        const searchIndex = new Index({
          tokenize: 'forward',
        })

        cached.data.forEach((item, idx) => {
          const searchableText = [
            item.title || '',
            item.description || '',
            (item.tags || []).join(' '),
            item.content || '',
          ]
            .join(' ')
            .toLowerCase()
          searchIndex.add(idx, searchableText)
        })

        if (!cancelled) {
          setIndex(searchIndex)
        }
        return
      }

      setIsLoadingIndex(true)
      setError(null)

      try {
        const response = await fetch('/api/search-index.json')
        if (!response.ok) throw new Error('Failed to load search index')
        const data: SearchResult[] = await response.json()

        if (cancelled) return

        // Cache the index
        cacheIndex(data)

        setSearchIndex(data)

        // Create FlexSearch index
        const searchIndex = new Index({
          tokenize: 'forward',
        })

        // Index all fields
        data.forEach((item, idx) => {
          const searchableText = [
            item.title || '',
            item.description || '',
            (item.tags || []).join(' '),
            item.content || '',
          ]
            .join(' ')
            .toLowerCase()
          searchIndex.add(idx, searchableText)
        })

        if (!cancelled) {
          setIndex(searchIndex)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading search index:', error)
          setError('Failed to load search index. Please try again later.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingIndex(false)
        }
      }
    }

    // Only load if index hasn't been loaded yet
    if (!index) {
      loadSearchIndex()
    }

    return () => {
      cancelled = true
    }
  }, [open, index])

  // Perform search with fuzzy matching and improved relevance
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!index || !searchQuery.trim()) {
        setResults([])
        setSelectedIndex(0)
        setDisplayedResults(10)
        return
      }

      setIsLoading(true)
      setError(null)
      const normalizedQuery = searchQuery.toLowerCase().trim()

      try {
        // First try exact search
        let searchResults = index.search(normalizedQuery, {
          limit: 50,
        })

        // If no results, try fuzzy matching
        if (searchResults.length === 0 && normalizedQuery.length > 2) {
          const words = normalizedQuery.split(/\s+/)
          const wordResults = new Set<number>()

          words.forEach((word) => {
            if (word.length > 2) {
              const wordSearch = index.search(word, { limit: 20 })
              wordSearch.forEach((idx) => wordResults.add(Number(idx)))
            }
          })

          searchResults = Array.from(wordResults)
        }

        const matchedResults = searchResults
          .map((idx: number | string) => searchIndex[Number(idx)])
          .filter(Boolean) as SearchResult[]

        // Calculate relevance scores and sort
        const scoredResults = matchedResults.map((result) => ({
          result,
          score: calculateRelevanceScore(result, searchQuery, normalizedQuery),
        }))

        scoredResults.sort((a, b) => b.score - a.score)

        const sortedResults = scoredResults.map((item) => item.result)

        setResults(sortedResults)
        setSelectedIndex(0)
        setDisplayedResults(10)
      } catch (error) {
        console.error('Search error:', error)
        setError('An error occurred while searching. Please try again.')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [index, searchIndex],
  )

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      setDisplayedResults(10)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, PERFORMANCE.SEARCH_DEBOUNCE)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }, 100)
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setDisplayedResults(10)
      setError(null)
    }
  }, [open])

  // Reset scroll position when query changes
  useEffect(() => {
    if (scrollContainerRef.current && query.trim()) {
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const maxIndex = Math.min(displayedResults - 1, results.length - 1)
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter' && results[selectedIndex]?.url) {
        e.preventDefault()
        const url = results[selectedIndex].url
        if (url) {
          window.location.href = url
          onOpenChange(false)
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selectedIndex, onOpenChange, displayedResults])

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as
        | HTMLElement
        | undefined
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [selectedIndex])

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text

    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary font-medium">
            {part}
          </mark>
        ) : (
          part
        ),
      )
    } catch {
      return text
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const hasMoreResults = results.length > displayedResults
  const visibleResults = results.slice(0, displayedResults)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="w-[720px] max-w-full p-0 gap-0 overflow-hidden h-[100dvh] flex flex-col rounded-none">
        <DialogDescription className="sr-only">
          Search blog posts by title, description, tags, or content
        </DialogDescription>
        {/* Live region for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {isLoading && 'Searching...'}
          {!isLoading && query.trim() && results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          {!isLoading && query.trim() && results.length === 0 && 'No results found'}
          {selectedIndex >= 0 && results[selectedIndex] && `Selected: ${results[selectedIndex].title}`}
        </div>
        <div className="flex shrink-0 items-center gap-4 border-b border-border p-4">
          <a href="/" className="flex shrink-0 items-center">
            <img
              src="/static/logo.png"
              alt="Logo"
              className="h-6 w-auto"
              height={24}
            />
          </a>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none border-0 shadow-none appearance-none placeholder:text-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-0"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
              }}
              aria-label="Search blog posts"
              aria-expanded={results.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={
                results.length > 0 && selectedIndex >= 0
                  ? `result-${selectedIndex}`
                  : undefined
              }
              role="combobox"
              aria-autocomplete="list"
            />
            {isLoading && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin border-2 border-t-transparent text-foreground/70" />
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer shrink-0"
            aria-label="Close search"
          >
            <FiX className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex shrink-0 items-center gap-4 bg-primary/10 p-4 text-primary mx-4 mt-4"
          >
            <span className="sr-only">Error</span>
            <span>{error}</span>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Loading skeleton */}
          {isLoadingIndex && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-border/20 p-4">
                  <div className="h-4 w-3/4 bg-foreground/20 mb-4" />
                  <div className="h-3 w-full bg-foreground/20 mb-2" />
                  <div className="h-3 w-2/3 bg-foreground/20" />
                </div>
              ))}
            </div>
          )}

          {/* Recent posts - show when no query */}
          {!query.trim() && !isLoadingIndex && searchIndex.length > 0 && (
            <ul className="space-y-4">
              {searchIndex.slice(0, 5).map((post) => (
                <li key={post.id}>
                  <a
                    href={post.url}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-col gap-4 p-4 border border-border transition-colors active:bg-border/20 focus:bg-border/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium leading-tight">
                        {post.title}
                      </h3>
                      <span className="shrink-0 text-foreground/70">
                        {formatDate(post.date)}
                      </span>
                    </div>
                    {post.description && (
                      <p className="text-foreground/70 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && !isLoading && !isLoadingIndex && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-foreground/70">No results found for "{query}"</p>
            </div>
          )}

          {/* Results */}
          {query.trim() && visibleResults.length > 0 && (
            <ul
              ref={resultsRef}
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="space-y-4"
            >
              {visibleResults.map((result, idx) => (
                <li
                  key={result.id}
                  id={`result-${idx}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <a
                    href={result.url}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex flex-col gap-4 p-4 border border-border transition-colors',
                      'active:bg-border/20 focus-visible:bg-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      idx === selectedIndex && 'bg-border/20',
                    )}
                    aria-label={`Go to ${result.title}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium leading-snug flex-1">
                        {highlightText(result.title, query)}
                      </h3>
                      <span className="shrink-0 text-foreground/70">
                        {formatDate(result.date)}
                      </span>
                    </div>

                    {result.description && (
                      <p className="text-foreground/70 line-clamp-2 leading-relaxed">
                        {highlightText(result.description, query)}
                      </p>
                    )}

                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {result.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center bg-border px-2 py-1 text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-foreground/70">
                            +{result.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Load more button */}
          {hasMoreResults && (
            <div className="mt-4 mb-4 flex justify-center pb-safe">
              <button
                onClick={() =>
                  setDisplayedResults((prev) => Math.min(prev + 10, results.length))
                }
                className="flex items-center gap-4 border border-border bg-background px-4 py-4 text-foreground transition-colors active:bg-border/20 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                Load more ({results.length - displayedResults} remaining)
              </button>
            </div>
          )}

          <div className="h-4" aria-hidden="true" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
