"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Keyboard, Mouse, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KeyboardShortcut, KeyboardShortcutManager } from "@/lib/KeyboardShortcuts"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts?: KeyboardShortcut[]
}

export default function HelpModal({ isOpen, onClose, shortcuts = [] }: HelpModalProps) {
  const shortcutManager = new KeyboardShortcutManager()
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Help & Controls</h2>
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Mouse Controls */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Mouse className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Mouse Controls</h3>
                  </div>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex justify-between">
                      <span>Rotate View</span>
                      <span className="text-gray-500">Left Click + Drag</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zoom In/Out</span>
                      <span className="text-gray-500">Scroll Wheel</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pan View</span>
                      <span className="text-gray-500">Right Click + Drag</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Select Philosopher</span>
                      <span className="text-gray-500">Click on Node</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Select Domain</span>
                      <span className="text-gray-500">Click on Slice</span>
                    </div>
                  </div>
                </section>
                
                {/* Keyboard Shortcuts */}
                {shortcuts.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Keyboard className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                    </div>
                    <div className="space-y-2 text-gray-300">
                      {shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs bg-gray-800 rounded border border-gray-700">
                            {shortcutManager.formatShortcut(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Features Guide */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Features Guide</h3>
                  </div>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <h4 className="font-medium text-white mb-1">Visualization Modes</h4>
                      <p className="text-sm">
                        Switch between Orb view (spherical arrangement by domain and time) and Helix view 
                        (double helix timeline) to explore different perspectives of philosophical history.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Connections</h4>
                      <p className="text-sm">
                        Enable connections to see influence relationships between philosophers. 
                        Particle streams flow from influencer to influenced thinkers.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Filtering</h4>
                      <p className="text-sm">
                        Use the sidebar to filter philosophers by era, domain, or search for specific 
                        names and concepts. The timeline slider lets you focus on specific periods.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Quality Settings</h4>
                      <p className="text-sm">
                        Adjust quality settings if you experience performance issues. Lower settings 
                        reduce particle count and geometry detail for smoother performance.
                      </p>
                    </div>
                  </div>
                </section>
                
                {/* Accessibility */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">Accessibility</h3>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <p>
                      • Use Tab to navigate through interactive elements
                    </p>
                    <p>
                      • Screen reader support for philosopher information
                    </p>
                    <p>
                      • High contrast mode available in settings
                    </p>
                    <p>
                      • Reduce motion option for sensitive users
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 