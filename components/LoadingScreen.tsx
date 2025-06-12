"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
  progress: number
  isLoading: boolean
  onComplete?: () => void
}

export default function LoadingScreen({ progress, isLoading, onComplete }: LoadingScreenProps) {
  const [showContent, setShowContent] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState("Initializing")
  
  useEffect(() => {
    if (progress < 20) {
      setLoadingPhase("Initializing scene...")
    } else if (progress < 40) {
      setLoadingPhase("Creating philosophical domains...")
    } else if (progress < 60) {
      setLoadingPhase("Loading philosophers...")
    } else if (progress < 80) {
      setLoadingPhase("Building connections...")
    } else if (progress < 100) {
      setLoadingPhase("Finalizing visualization...")
    } else {
      setLoadingPhase("Ready!")
      setTimeout(() => {
        setShowContent(false)
        onComplete?.()
      }, 500)
    }
  }, [progress, onComplete])
  
  return (
    <AnimatePresence>
      {isLoading && showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <div className="relative w-full max-w-md px-8">
            {/* Logo or Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-white mb-2">
                Philosophical Nexus
              </h1>
              <p className="text-gray-400">
                Exploring the connections of human thought
              </p>
            </motion.div>
            
            {/* Progress Bar Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              {/* Background Track */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                />
              </div>
              
              {/* Progress Text */}
              <div className="mt-4 flex justify-between items-center">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-gray-400"
                >
                  {loadingPhase}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-gray-400"
                >
                  {Math.round(progress)}%
                </motion.p>
              </div>
            </motion.div>
            
            {/* Loading Tips */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <LoadingTip />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LoadingTip() {
  const tips = [
    "Use scroll to zoom and drag to rotate the visualization",
    "Click on philosophers to see their details and connections",
    "Press 'H' for help and keyboard shortcuts",
    "Toggle between Orb and Helix view with 'V'",
    "Press 'C' to show all philosophical connections",
    "Use the sidebar to filter by era, domain, or search"
  ]
  
  const [currentTip, setCurrentTip] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [tips.length])
  
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={currentTip}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-gray-500"
      >
        💡 {tips[currentTip]}
      </motion.p>
    </AnimatePresence>
  )
} 