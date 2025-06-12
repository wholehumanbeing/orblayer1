"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { domainColors } from "@/app/data/allPhilosophers"
import type { PhilosopherData } from "@/app/types/philosopher"

interface PhilosopherPanelProps {
  philosopher: PhilosopherData
  domain: string
  index: number
  totalPanels: number
  onClose: () => void
  onNavigate?: (direction: 'prev' | 'next') => void
}

export default function PhilosopherPanel({
  philosopher,
  domain,
  index,
  totalPanels,
  onClose,
  onNavigate
}: PhilosopherPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Calculate panel width based on number of panels
  const getPanelWidth = () => {
    if (totalPanels === 1) return "w-96"
    if (totalPanels === 2) return "w-80"
    return "w-72"
  }

  // Calculate right position for stacking
  const getRightPosition = () => {
    const baseRight = 16 // 1rem
    const panelGap = totalPanels > 1 ? 8 : 0 // 0.5rem gap between panels
    const panelWidth = totalPanels === 1 ? 384 : totalPanels === 2 ? 320 : 288
    return baseRight + (index * (panelWidth + panelGap))
  }

  return (
    <motion.div
      className={`fixed top-20 z-40 glass-dark border border-white/10 text-white rounded-xl glass-shadow ${getPanelWidth()} max-h-[calc(100vh-6rem)] overflow-hidden`}
      initial={{ x: 400, opacity: 0, scale: 0.95 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        scale: 1,
        right: `${getRightPosition()}px`
      }}
      exit={{ x: 400, opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      style={{ right: `${getRightPosition()}px` }}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/10 glass">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h2 className="heading-primary flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full animate-pulse-glow border-glow"
                style={{ backgroundColor: domainColors[domain as keyof typeof domainColors] }}
              />
              {philosopher.name}
            </h2>
            <p className="text-white/60 text-sm mt-2 font-medium">{philosopher.era} Era</p>
          </div>
          <div className="flex items-center gap-2">
            {totalPanels > 1 && onNavigate && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate('prev')}
                  className="h-7 w-7 glass-button"
                  disabled={index === 0}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate('next')}
                  className="h-7 w-7 glass-button"
                  disabled={index === totalPanels - 1}
                >
                  <ChevronRight size={14} />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 glass-button"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 0 : 180 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft size={14} />
              </motion.div>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-7 w-7 glass-button hover:bg-red-500/20"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Birth/Death info */}
        <div className="flex items-center gap-3 text-sm text-white/50">
          <span className="capitalize font-medium text-white/70" style={{ color: domainColors[domain as keyof typeof domainColors] + 'CC' }}>
            {domain}
          </span>
          <span className="text-white/30">•</span>
          <span>
            {typeof philosopher.birth === "number" && philosopher.birth < 0
              ? `${Math.abs(philosopher.birth)} BCE`
              : `${philosopher.birth} CE`}
            {philosopher.death && " - "}
            {typeof philosopher.death === "number" && philosopher.death < 0
              ? `${Math.abs(philosopher.death)} BCE`
              : philosopher.death
                ? `${philosopher.death} CE`
                : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-y-auto max-h-[calc(100vh-12rem)]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 space-y-5">
              {/* Domain Summary */}
              <div className="glass-panel">
                <h3 className="heading-secondary mb-3">
                  {domain.charAt(0).toUpperCase() + domain.slice(1)} Contributions
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {philosopher.domainSummaries[domain as keyof typeof philosopher.domainSummaries]}
                </p>
              </div>

              {/* Tags */}
              <div className="glass-panel">
                <h3 className="heading-secondary mb-3">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {philosopher.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 glass glass-hover rounded-full font-medium transition-all duration-200 hover:scale-105"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Influences */}
              {philosopher.influences && philosopher.influences.length > 0 && (
                <div className="glass-panel">
                  <h3 className="heading-secondary mb-3">Philosophical Influences</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-white/80">{philosopher.influences.length}</span>
                    </div>
                    <p className="text-sm text-white/60">
                      Connected philosopher{philosopher.influences.length > 1 ? 's' : ''} in the network of ideas
                    </p>
                  </div>
                </div>
              )}

              {/* Panel indicator for multiple panels */}
              {totalPanels > 1 && (
                <div className="pt-5 flex justify-center gap-2">
                  {Array.from({ length: totalPanels }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === index ? 'bg-white/80 scale-125' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 