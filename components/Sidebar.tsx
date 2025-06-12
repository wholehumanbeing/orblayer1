"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Network, 
  Pause, 
  Play, 
  ChevronUp, 
  ChevronDown,
  Filter,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { 
  domainColors, 
  timePeriods,
  allPhilosophers
} from "@/app/data/allPhilosophers"
import SearchResults from "./SearchResults"
import type { PhilosopherData } from "@/app/types/philosopher"

interface SidebarProps {
  // View mode
  viewMode: 'orb' | 'helix'
  onViewModeChange: (mode: 'orb' | 'helix') => void

  // Connection controls
  showConnections: boolean
  onShowConnectionsChange: (show: boolean) => void

  // Animation controls
  isPaused: boolean
  onPausedChange: (paused: boolean) => void
  speed: number
  onSpeedChange: (speed: number) => void

  // Timeline controls
  timeRange: [number, number]
  onTimeRangeChange: (range: [number, number]) => void
  minYear: number
  maxYear: number

  // Filter controls
  selectedEras: string[]
  onSelectedErasChange: (eras: string[]) => void
  selectedDomains: string[]
  onSelectedDomainsChange: (domains: string[]) => void

  // Search
  searchQuery: string
  onSearchQueryChange: (query: string) => void

  // Visibility count
  visiblePhilosophersCount: number
  totalPhilosophersCount: number

  // Philosopher selection
  onSelectPhilosopher: (philosopher: PhilosopherData) => void
}

export default function Sidebar({
  viewMode,
  onViewModeChange,
  showConnections,
  onShowConnectionsChange,
  isPaused,
  onPausedChange,
  speed,
  onSpeedChange,
  timeRange,
  onTimeRangeChange,
  minYear,
  maxYear,
  selectedEras,
  onSelectedErasChange,
  selectedDomains,
  onSelectedDomainsChange,
  searchQuery,
  onSearchQueryChange,
  visiblePhilosophersCount,
  totalPhilosophersCount,
  onSelectPhilosopher
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const formatYear = (year: number): string => {
    if (year < 0) return `${Math.abs(year)} BCE`
    return `${year} CE`
  }

  const toggleEra = (era: string) => {
    if (selectedEras.includes(era)) {
      onSelectedErasChange(selectedEras.filter(e => e !== era))
    } else {
      onSelectedErasChange([...selectedEras, era])
    }
  }

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      onSelectedDomainsChange(selectedDomains.filter(d => d !== domain))
    } else {
      onSelectedDomainsChange([...selectedDomains, domain])
    }
  }

  const domains = Object.keys(domainColors)

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 glass glass-hover text-white p-3 rounded-full glass-shadow animate-pulse-glow"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ x: 0 }}
          animate={{ 
            x: isCollapsed ? (isMobile ? -320 : -280) : 0,
            width: isMobile ? 320 : 280
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 h-full glass-dark border-r border-white/10 z-40 overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 glass">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-primary">Controls</h2>
              {!isMobile && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search philosophers..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => {
                  // Delay hiding to allow click on results
                  setTimeout(() => setShowSearchResults(false), 200)
                }}
                className="pl-9 h-10 text-sm glass border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-1 focus:ring-white/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchQueryChange("")
                    setShowSearchResults(false)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              <SearchResults
                results={allPhilosophers.filter(philosopher => {
                  const query = searchQuery.toLowerCase()
                  return philosopher.name.toLowerCase().includes(query) ||
                    philosopher.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    Object.values(philosopher.domainSummaries).some(summary => 
                      summary.toLowerCase().includes(query)
                    )
                })}
                searchQuery={searchQuery}
                onSelectPhilosopher={(philosopher) => {
                  onSelectPhilosopher(philosopher)
                  setShowSearchResults(false)
                  onSearchQueryChange("")
                }}
                isVisible={showSearchResults && searchQuery.length > 0}
              />
            </div>

            {/* Count display */}
            <div className="mt-3 space-y-2">
              <div className="text-xs text-white/50 font-medium">
                Showing <span className="text-white/80">{visiblePhilosophersCount}</span> of <span className="text-white/80">{totalPhilosophersCount}</span> philosophers
              </div>
              
              {/* Active filters indicator */}
              {(() => {
                const activeFilters = []
                if (selectedEras.length < timePeriods.length) {
                  activeFilters.push(`${selectedEras.length} era${selectedEras.length !== 1 ? 's' : ''}`)
                }
                if (selectedDomains.length < Object.keys(domainColors).length) {
                  activeFilters.push(`${selectedDomains.length} domain${selectedDomains.length !== 1 ? 's' : ''}`)
                }
                const [minTime, maxTime] = timeRange
                if (minTime > minYear || maxTime < maxYear) {
                  activeFilters.push('time range')
                }
                
                if (activeFilters.length > 0) {
                  return (
                    <div className="flex items-center gap-2 text-xs">
                      <Filter size={12} className="text-blue-400" />
                      <span className="text-white/60">
                        Active filters: <span className="text-blue-400">{activeFilters.join(', ')}</span>
                      </span>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* View Mode */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">View Mode</h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'orb' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('orb')}
                  className={`flex-1 glass-button ${viewMode === 'orb' ? 'bg-blue-500/20 border-blue-500/50 text-blue-100' : ''}`}
                >
                  Orb View
                </Button>
                <Button
                  variant={viewMode === 'helix' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('helix')}
                  className={`flex-1 glass-button ${viewMode === 'helix' ? 'bg-purple-500/20 border-purple-500/50 text-purple-100' : ''}`}
                >
                  Timeline View
                </Button>
              </div>
            </div>

            {/* Era Filter */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">Filter by Era</h3>
              <div className="space-y-3">
                {timePeriods.map((period) => (
                  <label
                    key={period.name}
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white cursor-pointer group transition-colors"
                  >
                    <Checkbox
                      checked={selectedEras.includes(period.name)}
                      onCheckedChange={() => toggleEra(period.name)}
                      className="border-white/20 data-[state=checked]:bg-blue-500/30 data-[state=checked]:border-blue-400"
                    />
                    <span className="flex-1 font-medium">{period.name}</span>
                    <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                      {formatYear(period.startYear)} - {formatYear(period.endYear)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Domain Filter */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">Filter by Domain</h3>
              <div className="space-y-3">
                {domains.map((domain) => (
                  <label
                    key={domain}
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white cursor-pointer group transition-colors"
                  >
                    <Checkbox
                      checked={selectedDomains.includes(domain)}
                      onCheckedChange={() => toggleDomain(domain)}
                      className="border-white/20 data-[state=checked]:bg-blue-500/30 data-[state=checked]:border-blue-400"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" 
                        style={{ backgroundColor: domainColors[domain as keyof typeof domainColors] }}
                      />
                      <span className="capitalize font-medium">{domain}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">Time Range</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-white/80 font-medium">
                  <span>{formatYear(timeRange[0])}</span>
                  <span>{formatYear(timeRange[1])}</span>
                </div>
                <Slider
                  min={minYear}
                  max={maxYear}
                  step={1}
                  value={timeRange}
                  onValueChange={onTimeRangeChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>{formatYear(minYear)}</span>
                  <span>{formatYear(maxYear)}</span>
                </div>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">Animation</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPausedChange(!isPaused)}
                    className="flex-1 glass-button"
                  >
                    {isPaused ? (
                      <>
                        <Play size={14} className="mr-2" />
                        Play
                      </>
                    ) : (
                      <>
                        <Pause size={14} className="mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Speed</span>
                    <span className="text-sm text-white/80 font-medium">{speed.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 glass-button"
                      onClick={() => onSpeedChange(Math.max(0.1, speed - 0.1))}
                    >
                      <ChevronDown size={14} />
                    </Button>
                    <Slider
                      value={[speed]}
                      min={0.1}
                      max={3}
                      step={0.1}
                      onValueChange={(value) => onSpeedChange(value[0])}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 glass-button"
                      onClick={() => onSpeedChange(Math.min(3, speed + 0.1))}
                    >
                      <ChevronUp size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Controls */}
            <div className="glass-panel">
              <h3 className="heading-secondary mb-4">Connections</h3>
              <Button
                variant={showConnections ? 'default' : 'outline'}
                size="sm"
                onClick={() => onShowConnectionsChange(!showConnections)}
                className={`w-full glass-button ${showConnections ? 'bg-green-500/20 border-green-500/50 text-green-100' : ''}`}
              >
                <Network size={14} className="mr-2" />
                {showConnections ? 'Hide' : 'Show'} Influences
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Desktop collapse button when sidebar is hidden */}
      {!isMobile && isCollapsed && (
        <button
          className="fixed top-4 left-4 z-40 glass glass-hover text-white p-3 rounded-full glass-shadow animate-pulse-glow"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </>
  )
} 