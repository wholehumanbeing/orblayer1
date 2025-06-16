import * as THREE from 'three'
import { PhilosopherData } from '@/app/types/philosopher'

export interface LayoutPosition {
  position: THREE.Vector3
  rotation?: THREE.Euler
  scale?: THREE.Vector3
}

const domains = ['ethics', 'politics', 'metaphysics', 'epistemology', 'aesthetics']

export function calculateHelixLayout(
  philosophers: PhilosopherData[]
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>()
  
  // Sort by birth year - handle both number and string formats
  const sorted = [...philosophers].sort((a, b) => {
    const yearA = typeof a.birth === 'number' ? a.birth : parseInt(a.birth)
    const yearB = typeof b.birth === 'number' ? b.birth : parseInt(b.birth)
    return yearA - yearB
  })
  
  sorted.forEach((philosopher, index) => {
    const t = index / Math.max(1, sorted.length - 1)
    
    // Double helix parameters
    const strand = index % 2
    const helixRadius = 4 + strand * 2
    const helixHeight = 20
    const rotations = 6
    
    const angle = t * Math.PI * 2 * rotations + (strand * Math.PI)
    const y = (t - 0.5) * helixHeight
    
    positions.set(philosopher.id, {
      position: new THREE.Vector3(
        Math.cos(angle) * helixRadius,
        y,
        Math.sin(angle) * helixRadius
      )
    })
  })
  
  return positions
}

export function calculateSpiralLayout(
  philosophers: PhilosopherData[]
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>()
  
  philosophers.forEach((philosopher) => {
    const birthYear = typeof philosopher.birth === 'number' ? philosopher.birth : parseInt(philosopher.birth)
    const normalizedYear = (birthYear + 600) / 2600
    const spiralRadius = 2 + normalizedYear * 4
    const spiralAngle = normalizedYear * 20 * Math.PI
    
    // Get domain index - defaulting to ethics if not found
    const primaryDomain = philosopher.domainSummaries ? 
      Object.keys(philosopher.domainSummaries).find(domain => 
        philosopher.domainSummaries[domain as keyof typeof philosopher.domainSummaries] !== ''
      ) || 'ethics' : 'ethics'
    const domainOffset = domains.indexOf(primaryDomain.toLowerCase()) * (Math.PI * 2 / 5)
    
    positions.set(philosopher.id, {
      position: new THREE.Vector3(
        Math.cos(spiralAngle + domainOffset) * spiralRadius,
        (normalizedYear - 0.5) * 10,
        Math.sin(spiralAngle + domainOffset) * spiralRadius
      )
    })
  })
  
  return positions
}

// Easing function for smooth transitions
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
} 