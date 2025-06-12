import * as THREE from "three"

export interface ParticleConnection {
  id: string
  from: THREE.Vector3
  to: THREE.Vector3
  fromId: string
  toId: string
  connectionType: 'influence' | 'contemporary' | 'school'
  color: THREE.Color
  particles: Particle[]
  curve: THREE.CatmullRomCurve3
  active: boolean
}

export interface Particle {
  position: THREE.Vector3
  progress: number
  speed: number
  size: number
  opacity: number
  color: THREE.Color
}

export class ParticleConnectionSystem {
  private connections: Map<string, ParticleConnection> = new Map()
  private particleGeometry: THREE.BufferGeometry
  private particleMaterial: THREE.ShaderMaterial
  private particleSystem: THREE.Points
  private scene: THREE.Scene
  private particlesPerConnection = 20
  private maxParticles = 10000
  private currentParticleCount = 0
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    
    // Initialize particle system
    this.particleGeometry = new THREE.BufferGeometry()
    
    // Create arrays for particle attributes
    const positions = new Float32Array(this.maxParticles * 3)
    const colors = new Float32Array(this.maxParticles * 3)
    const sizes = new Float32Array(this.maxParticles)
    const opacities = new Float32Array(this.maxParticles)
    
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))
    
    // Create shader material for particles
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          // Create circular particle with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) {
            discard;
          }
          
          // Soft edge
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vOpacity;
          
          // Add glow effect
          vec3 finalColor = vColor;
          float glow = 1.0 + sin(time * 2.0) * 0.2;
          finalColor *= glow;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial)
    this.scene.add(this.particleSystem)
  }
  
  // Add a new connection
  addConnection(
    fromId: string,
    toId: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    connectionType: 'influence' | 'contemporary' | 'school' = 'influence'
  ): string {
    const connectionId = `${fromId}-${toId}`
    
    // Define colors for different connection types
    const connectionColors = {
      influence: new THREE.Color(0x40E0D0), // Turquoise
      contemporary: new THREE.Color(0xFFD700), // Gold
      school: new THREE.Color(0xFF69B4) // Hot pink
    }
    
    // Create curve for particle path
    const midPoint = new THREE.Vector3()
      .addVectors(from, to)
      .multiplyScalar(0.5)
    
    // Calculate curve height based on distance
    const distance = from.distanceTo(to)
    const curveHeight = Math.min(distance * 0.3, 2)
    midPoint.y += curveHeight
    
    const curve = new THREE.CatmullRomCurve3([
      from.clone(),
      midPoint,
      to.clone()
    ])
    
    // Initialize particles for this connection
    const particles: Particle[] = []
    for (let i = 0; i < this.particlesPerConnection; i++) {
      particles.push({
        position: new THREE.Vector3(),
        progress: i / this.particlesPerConnection,
        speed: 0.2 + Math.random() * 0.3,
        size: 1 + Math.random() * 2,
        opacity: 0.5 + Math.random() * 0.5,
        color: connectionColors[connectionType].clone()
      })
    }
    
    const connection: ParticleConnection = {
      id: connectionId,
      from,
      to,
      fromId,
      toId,
      connectionType,
      color: connectionColors[connectionType],
      particles,
      curve,
      active: true
    }
    
    this.connections.set(connectionId, connection)
    return connectionId
  }
  
  // Remove a connection
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId)
  }
  
  // Set connection active state
  setConnectionActive(connectionId: string, active: boolean): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.active = active
    }
  }
  
  // Update all particles
  update(deltaTime: number): void {
    // Update shader uniforms
    this.particleMaterial.uniforms.time.value += deltaTime
    
    // Get buffer attributes
    const positions = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const colors = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute
    const sizes = this.particleGeometry.getAttribute('size') as THREE.BufferAttribute
    const opacities = this.particleGeometry.getAttribute('opacity') as THREE.BufferAttribute
    
    let particleIndex = 0
    
    // Update each connection's particles
    this.connections.forEach(connection => {
      if (!connection.active) return
      
      connection.particles.forEach(particle => {
        if (particleIndex >= this.maxParticles) return
        
        // Update particle progress along curve
        particle.progress += particle.speed * deltaTime
        if (particle.progress > 1) {
          particle.progress -= 1
          // Randomize properties on reset
          particle.speed = 0.2 + Math.random() * 0.3
          particle.size = 1 + Math.random() * 2
          particle.opacity = 0.5 + Math.random() * 0.5
        }
        
        // Get position on curve
        const point = connection.curve.getPointAt(particle.progress)
        particle.position.copy(point)
        
        // Add some random offset for variation
        particle.position.x += (Math.random() - 0.5) * 0.1
        particle.position.y += (Math.random() - 0.5) * 0.1
        particle.position.z += (Math.random() - 0.5) * 0.1
        
        // Fade in/out at ends
        let fadeOpacity = particle.opacity
        if (particle.progress < 0.1) {
          fadeOpacity *= particle.progress / 0.1
        } else if (particle.progress > 0.9) {
          fadeOpacity *= (1 - particle.progress) / 0.1
        }
        
        // Update buffer attributes
        positions.setXYZ(particleIndex, particle.position.x, particle.position.y, particle.position.z)
        colors.setXYZ(particleIndex, particle.color.r, particle.color.g, particle.color.b)
        sizes.setX(particleIndex, particle.size)
        opacities.setX(particleIndex, fadeOpacity)
        
        particleIndex++
      })
    })
    
    // Hide unused particles
    for (let i = particleIndex; i < this.maxParticles; i++) {
      positions.setXYZ(i, 0, -1000, 0)
      opacities.setX(i, 0)
    }
    
    // Mark attributes as needing update
    positions.needsUpdate = true
    colors.needsUpdate = true
    sizes.needsUpdate = true
    opacities.needsUpdate = true
    
    // Update draw range
    this.particleGeometry.setDrawRange(0, particleIndex)
  }
  
  // Clear all connections
  clearAllConnections(): void {
    this.connections.clear()
  }
  
  // Get connection by ID
  getConnection(connectionId: string): ParticleConnection | undefined {
    return this.connections.get(connectionId)
  }
  
  // Get all connections
  getAllConnections(): ParticleConnection[] {
    return Array.from(this.connections.values())
  }
  
  // Dispose of resources
  dispose(): void {
    this.particleGeometry.dispose()
    this.particleMaterial.dispose()
    this.scene.remove(this.particleSystem)
  }
} 