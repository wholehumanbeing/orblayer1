"use client"

import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InfoPanelProps {
  slice: {
    name: string
    color: string
    description: string
  }
  eras: Array<{
    name: string
    period: string
    radius: number
  }>
  onClose: () => void
}

export default function InfoPanel({ slice, eras, onClose }: InfoPanelProps) {
  const philosophicalContent = {
    Logic: {
      Ancient: "Aristotle's syllogistic logic, Stoic propositional logic",
      Medieval: "Scholastic logic, universals debate",
      Renaissance: "Humanist dialectic, method of loci",
      Modern: "Symbolic logic, Leibniz's calculus ratiocinator",
      Contemporary: "Mathematical logic, computational logic, AI reasoning",
    },
    Aesthetics: {
      Ancient: "Plato's theory of beauty, Aristotle's poetics",
      Medieval: "Divine beauty, Gothic aesthetics",
      Renaissance: "Perspective, proportion, humanism in art",
      Modern: "Kant's critique of judgment, Romantic sublime",
      Contemporary: "Postmodern art, digital aesthetics, NFTs",
    },
    Ethics: {
      Ancient: "Virtue ethics, Stoicism, Epicureanism",
      Medieval: "Divine command theory, natural law",
      Renaissance: "Civic humanism, Machiavellian ethics",
      Modern: "Deontology, utilitarianism, social contract",
      Contemporary: "Applied ethics, environmental ethics, AI ethics",
    },
    Politics: {
      Ancient: "Plato's Republic, Aristotle's Politics",
      Medieval: "Divine right, feudalism, just war theory",
      Renaissance: "Republicanism, sovereignty, reason of state",
      Modern: "Liberalism, democracy, rights theory",
      Contemporary: "Global justice, digital democracy, posthuman politics",
    },
    Metaphysics: {
      Ancient: "Forms, substance, causation, being",
      Medieval: "Essence/existence, universals, God's nature",
      Renaissance: "Infinity, heliocentrism, natural magic",
      Modern: "Mind-body dualism, monads, idealism",
      Contemporary: "Quantum ontology, simulation hypothesis, emergence",
    },
  }

  const content = philosophicalContent[slice.name as keyof typeof philosophicalContent] || {}

  return (
    <motion.div
      className="fixed top-4 left-4 z-50 glass-dark border border-white/10 text-white rounded-xl glass-shadow max-w-md w-full md:w-96"
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="heading-primary flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border-glow animate-pulse-glow" style={{ backgroundColor: slice.color }} />
              {slice.name}
            </h2>
            <p className="text-white/60 text-sm mt-2">{slice.description}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8 glass-button hover:bg-white/10"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="space-y-5">
          <h3 className="heading-secondary">Historical Development</h3>
          <div className="space-y-3">
            {eras.map((era) => (
              <motion.div 
                key={era.name} 
                className="glass p-4 rounded-lg border-l-4 hover:bg-white/[0.03] transition-all duration-300"
                style={{ borderLeftColor: slice.color + '40' }}
                whileHover={{ x: 4 }}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm text-white/90">{era.name}</h4>
                  <span className="text-xs text-white/40 font-medium">{era.period}</span>
                </div>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  {content[era.name as keyof typeof content] || "Development in progress..."}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-xs text-white/40 leading-relaxed">
            Navigate through time from the core outward. Each ring represents a major era in philosophical thought.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
