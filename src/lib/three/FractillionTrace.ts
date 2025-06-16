import * as THREE from 'three'
import { PhilosopherData } from '@/app/types/philosopher'

interface Particle {
  progress: number
  speed: number
  size: number
  color: THREE.Color
}

interface TraceConnection {
  from: string
  to: string
  strength: number
}

export class FractillionTraceSystem {
  private scene: THREE.Scene
  private traces: Map<string, TraceVisualization> = new Map()
  private particlePool: ParticlePool
  private getPositionFn?: (id: string) => THREE.Vector3 | undefined
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.particlePool = new ParticlePool(10000)
  }
  
  setPositionResolver(fn: (id: string) => THREE.Vector3 | undefined) {
    this.getPositionFn = fn
  }
  
  async createTrace(
    fromId: string,
    toId: string,
    path: PhilosopherData[],
    connections: TraceConnection[]
  ) {
    const traceId = `${fromId}-${toId}`
    
    // Remove existing trace if any
    this.removeTrace(traceId)
    
    // Create new trace visualization
    const trace = new TraceVisualization(path, connections)
    
    // Create curved paths between philosophers
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i]
      const to = path[i + 1]
      const connection = connections.find(
        c => c.from === from.id && c.to === to.id
      )
      
      const curve = this.createInfluenceCurve(from, to)
      const particles = this.particlePool.allocate(50)
      
      // Initialize particles along the curve
      particles.forEach((particle, j) => {
        particle.progress = j / particles.length
        particle.speed = 0.5 + Math.random() * 0.5
        particle.size = 1 + Math.random() * 2
        particle.color = this.getTraceColor(connection?.strength || 0.5)
      })
      
      trace.addPath(curve, particles)
    }
    
    this.traces.set(traceId, trace)
    trace.addToScene(this.scene)
    
    return trace
  }
  
  private createInfluenceCurve(
    from: PhilosopherData,
    to: PhilosopherData
  ): THREE.CatmullRomCurve3 {
    // Get philosopher positions from instance data
    const fromPos = this.getPhilosopherPosition(from.id)
    const toPos = this.getPhilosopherPosition(to.id)
    
    // Calculate curve height based on temporal distance
    const fromYear = typeof from.birth === 'number' ? from.birth : 0
    const toYear = typeof to.birth === 'number' ? to.birth : 0
    const timeDiff = Math.abs(toYear - fromYear)
    const curveHeight = Math.min(timeDiff / 100, 5)
    
    // Create control points for smooth curve
    const midPoint = fromPos.clone().lerp(toPos, 0.5)
    midPoint.y += curveHeight
    
    // Add some lateral offset for visual interest
    const perpendicular = new THREE.Vector3()
      .subVectors(toPos, fromPos)
      .cross(new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(curveHeight * 0.3)
    
    midPoint.add(perpendicular)
    
    return new THREE.CatmullRomCurve3([
      fromPos,
      midPoint,
      toPos
    ])
  }
  
  private getPhilosopherPosition(id: string): THREE.Vector3 {
    if (this.getPositionFn) {
      const position = this.getPositionFn(id)
      if (position) return position.clone()
    }
    
    // Fallback: return a placeholder position based on id hash
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return new THREE.Vector3(
      (hash % 100) - 50,
      ((hash * 2) % 100) - 50,
      ((hash * 3) % 100) - 50
    )
  }
  
  private getTraceColor(strength: number): THREE.Color {
    // Gradient from blue (weak) to red (strong)
    const hue = THREE.MathUtils.lerp(0.6, 0, strength)
    return new THREE.Color().setHSL(hue, 0.8, 0.5)
  }
  
  removeTrace(traceId: string) {
    const trace = this.traces.get(traceId)
    if (trace) {
      trace.removeFromScene()
      this.traces.delete(traceId)
    }
  }
  
  update(deltaTime: number) {
    this.traces.forEach(trace => {
      trace.update(deltaTime)
    })
  }
  
  dispose() {
    this.traces.forEach(trace => {
      trace.removeFromScene()
    })
    this.traces.clear()
    this.particlePool.dispose()
  }
}

class TraceVisualization {
  private group: THREE.Group
  private paths: Array<{
    curve: THREE.CatmullRomCurve3
    particles: Particle[]
    geometry: THREE.BufferGeometry
    material: THREE.PointsMaterial
    points: THREE.Points
  }> = []
  
  constructor(
    private philosophers: PhilosopherData[],
    private connections: TraceConnection[]
  ) {
    this.group = new THREE.Group()
  }
  
  addPath(curve: THREE.CatmullRomCurve3, particles: Particle[]) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particles.length * 3)
    const colors = new Float32Array(particles.length * 3)
    const sizes = new Float32Array(particles.length)
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: true
    })
    
    const points = new THREE.Points(geometry, material)
    this.group.add(points)
    
    this.paths.push({ curve, particles, geometry, material, points })
  }
  
  addToScene(scene: THREE.Scene) {
    scene.add(this.group)
  }
  
  removeFromScene() {
    if (this.group.parent) {
      this.group.parent.remove(this.group)
    }
    
    // Dispose of geometries and materials
    this.paths.forEach(({ geometry, material }) => {
      geometry.dispose()
      material.dispose()
    })
  }
  
  update(deltaTime: number) {
    this.paths.forEach(({ curve, particles, geometry }) => {
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute
      const colors = geometry.getAttribute('color') as THREE.BufferAttribute
      const sizes = geometry.getAttribute('size') as THREE.BufferAttribute
      
      particles.forEach((particle, i) => {
        // Update particle progress
        particle.progress += particle.speed * deltaTime * 0.1
        if (particle.progress > 1) {
          particle.progress -= 1
        }
        
        // Get position on curve
        const point = curve.getPointAt(particle.progress)
        positions.setXYZ(i, point.x, point.y, point.z)
        
        // Pulse effect
        const pulse = Math.sin(particle.progress * Math.PI * 2 + Date.now() * 0.001) * 0.5 + 0.5
        sizes.setX(i, particle.size * (0.5 + pulse * 0.5))
        
        // Fade in/out at ends
        let alpha = 1
        if (particle.progress < 0.1) {
          alpha = particle.progress / 0.1
        } else if (particle.progress > 0.9) {
          alpha = (1 - particle.progress) / 0.1
        }
        
        colors.setXYZ(
          i,
          particle.color.r * alpha,
          particle.color.g * alpha,
          particle.color.b * alpha
        )
      })
      
      positions.needsUpdate = true
      colors.needsUpdate = true
      sizes.needsUpdate = true
    })
  }
}

class ParticlePool {
  private particles: Particle[] = []
  private available: Particle[] = []
  
  constructor(private maxSize: number) {
    // Pre-allocate particles
    for (let i = 0; i < maxSize; i++) {
      const particle: Particle = {
        progress: 0,
        speed: 1,
        size: 1,
        color: new THREE.Color()
      }
      this.particles.push(particle)
      this.available.push(particle)
    }
  }
  
  allocate(count: number): Particle[] {
    const allocated: Particle[] = []
    for (let i = 0; i < count && this.available.length > 0; i++) {
      const particle = this.available.pop()!
      allocated.push(particle)
    }
    return allocated
  }
  
  release(particles: Particle[]) {
    particles.forEach(particle => {
      if (!this.available.includes(particle)) {
        this.available.push(particle)
      }
    })
  }
  
  dispose() {
    this.particles = []
    this.available = []
  }
} 