"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PhilosopherData } from "@/app/types/philosopher"
import { domainColors } from "@/app/data/allPhilosophers"

interface SearchResultsProps {
  results: PhilosopherData[]
  searchQuery: string
  onSelectPhilosopher: (philosopher: PhilosopherData) => void
  isVisible: boolean
}

export default function SearchResults({
  results,
  searchQuery,
  onSelectPhilosopher,
  isVisible
}: SearchResultsProps) {
  if (!isVisible || results.length === 0) return null

  // Highlight the search query in text
  const highlightText = (text: string) => {
    if (!searchQuery) return text
    
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-blue-500/30 text-blue-100 font-semibold">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full left-0 right-0 mt-2 glass-dark border border-white/10 rounded-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
      >
        <div className="p-2 border-b border-white/10">
          <p className="text-xs text-white/50">
            Found {results.length} philosopher{results.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="divide-y divide-white/5">
          {results.slice(0, 10).map((philosopher) => (
            <motion.button
              key={philosopher.id}
              onClick={() => onSelectPhilosopher(philosopher)}
              className="w-full text-left p-3 hover:bg-white/5 transition-colors group"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex items-start gap-3">
                {/* Domain color indicator */}
                <div className="flex gap-1 mt-1">
                  {Object.keys(philosopher.domainSummaries).map((domain) => (
                    <div
                      key={domain}
                      className="w-2 h-2 rounded-full ring-1 ring-white/20"
                      style={{ 
                        backgroundColor: domainColors[domain as keyof typeof domainColors] 
                      }}
                      title={domain}
                    />
                  ))}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-white/90 group-hover:text-white transition-colors">
                    {highlightText(philosopher.name)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/40">
                      {(() => {
                        const birthYear = typeof philosopher.birth === 'string' 
                          ? parseInt(philosopher.birth.replace('c. ', '')) 
                          : philosopher.birth
                        return birthYear < 0 ? `${Math.abs(birthYear)} BCE` : `${birthYear} CE`
                      })()}
                      {philosopher.death && (
                        <> - {(() => {
                          const deathYear = typeof philosopher.death === 'string' 
                            ? parseInt(philosopher.death.replace('c. ', '')) 
                            : philosopher.death
                          return deathYear < 0 ? `${Math.abs(deathYear)} BCE` : `${deathYear} CE`
                        })()}</>
                      )}
                    </span>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs text-white/40">{philosopher.era}</span>
                  </div>
                  
                  {/* Show matching tags if any */}
                  {philosopher.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {philosopher.tags
                        .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 3)
                        .map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                          >
                            {highlightText(tag)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        
        {results.length > 10 && (
          <div className="p-2 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              Showing 10 of {results.length} results
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
} 