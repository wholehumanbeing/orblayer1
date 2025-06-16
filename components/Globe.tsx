"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_ALL_PHILOSOPHERS, GET_INFLUENCE_TRACE } from '@/src/lib/graphql/queries'
import { usePhilosopherStore } from '@/src/store/philosopherStore'
import { useFilterStore } from '@/src/store/filterStore'
import { useSceneStore } from '@/src/store/sceneStore'
import { calculateHelixLayout, calculateSpiralLayout, easeInOutCubic, type LayoutPosition } from '@/src/lib/three/layouts'
import { FractillionTraceSystem } from '@/src/lib/three/FractillionTrace'
import Sidebar from "./Sidebar"
import PhilosopherPanel from "./PhilosopherPanel"
import LoadingScreen from "./LoadingScreen"
import HelpModal from "./HelpModal"
import { Info, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import gsap from "gsap"

// Type imports for Three.js addons
type EffectComposerType = EffectComposer
type OrbitControlsType = OrbitControls  
type CSS2DRendererType = CSS2DRenderer

// Domain configuration
const domains = ['ethics', 'politics', 'metaphysics', 'epistemology', 'aesthetics']
const domainColorValues = {
  ethics: new THREE.Color(0x3b82f6),
  politics: new THREE.Color(0xef4444),
  metaphysics: new THREE.Color(0x8b5cf6),
  epistemology: new THREE.Color(0xeab308),
  aesthetics: new THREE.Color(0xec4899)
}

interface GraphQLPhilosopher {
  id: string
  name: string
  birthYear: number
  deathYear: number
  era: string
  primaryDomain: string
  spiralDynamicsStage: string
  domains: Array<{
    domain: {
      name: string
    }
    strength: number
  }>
  influencedBy: Array<{
    id: string
    name: string
  }>
}

export default function Globe() {
  // Add logging at component initialization
  console.log('[Globe Component] Initializing Globe component')
  
  // GraphQL data fetching with enhanced error logging
  const { data, loading, error } = useQuery(GET_ALL_PHILOSOPHERS, {
    onError: (error) => {
      console.error('[Globe Component] GraphQL query error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack
      })
    },
    onCompleted: (data) => {
      console.log('[Globe Component] GraphQL query completed successfully:', {
        philosopherCount: data?.allPhilosophers?.length || 0
      })
    }
  })
  
  // Log initial query state
  useEffect(() => {
    console.log('[Globe Component] Query state:', { 
      loading, 
      hasData: !!data, 
      hasError: !!error,
      dataDetails: data ? { philosopherCount: data.allPhilosophers?.length } : null
    })
  }, [loading, data, error])
  
  const { setPhilosophers, philosophers, selectedPhilosopher, selectPhilosopher, visiblePhilosophers, setVisiblePhilosophers } = usePhilosopherStore()

  // Update store when data loads
  useEffect(() => {
    if (data?.allPhilosophers) {
      setPhilosophers(data.allPhilosophers)
      // Initialize all philosophers as visible
      const allIds = new Set<string>(data.allPhilosophers.map((p: GraphQLPhilosopher) => p.id))
      setVisiblePhilosophers(allIds)
    }
  }, [data, setPhilosophers, setVisiblePhilosophers])

  // Import stores
  const filters = useFilterStore()
  const { viewMode, setViewMode, isPaused, setIsPaused, speed, setSpeed, quality, setQuality } = useSceneStore()
  
  // Component state
  const mountRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => 
    typeof window !== 'undefined' ? !localStorage.getItem('philosophicalNexusVisited') : false
  )
  const [isTransitioning, setIsTransitioning] = useState(false)
  const targetPositionsRef = useRef<Map<string, LayoutPosition>>(new Map())
  const transitionProgressRef = useRef(0)
  
  // Timeline state
  const [activeTimeRange, setActiveTimeRange] = useState<[number, number]>([-700, 2100])

  // Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposerType | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControlsType | null>(null)
  const labelRendererRef = useRef<CSS2DRendererType | null>(null)
  const animationRef = useRef<number | null>(null)
  
  // Instanced mesh references
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const philosopherPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const connectionLinesRef = useRef<THREE.Group>(new THREE.Group())
  const spiralMeshRef = useRef<THREE.Mesh | null>(null)
  const nebulaRef = useRef<THREE.Mesh | null>(null)
  const starfieldRef = useRef<THREE.Points | null>(null)
  
  // Raycaster for interactions
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  
  // Fractillion Trace System
  const fractillionTraceRef = useRef<FractillionTraceSystem | null>(null)
  const [getTrace, { data: traceData, loading: traceLoading }] = useLazyQuery(
    GET_INFLUENCE_TRACE
  )
  
  // Request trace between philosophers
  const requestTrace = async (fromId: string, toId: string) => {
    try {
      const result = await getTrace({
        variables: { fromId, toId }
      })
      
      if (result.data?.trace && fractillionTraceRef.current) {
        const { path, connections } = result.data.trace
        await fractillionTraceRef.current.createTrace(
          fromId,
          toId,
          path,
          connections
        )
      }
    } catch (error) {
      console.error('Failed to create trace:', error)
    }
  }
  
  // LOD and optimization references - kept for future implementation
  // const lodSystemRef = useRef<PhilosopherLODSystem | null>(null)
  // const frustumCullingRef = useRef<FrustumCullingSystem | null>(null)
  // const keyboardManagerRef = useRef<KeyboardShortcutManager | null>(null)

  // Historical eras - kept for reference
  // const eras = [
  //   { name: "Ancient", period: "600 BCE - 500 CE", startYear: -600, endYear: 500 },
  //   { name: "Medieval", period: "500 - 1400 CE", startYear: 500, endYear: 1400 },
  //   { name: "Renaissance", period: "1400 - 1600 CE", startYear: 1400, endYear: 1600 },
  //   { name: "Early Modern", period: "1600 - 1800 CE", startYear: 1600, endYear: 1800 },
  //   { name: "Modern", period: "1800 - 1900 CE", startYear: 1800, endYear: 1900 },
  //   { name: "Contemporary", period: "1900 CE - Present", startYear: 1900, endYear: 2100 },
  // ]

  // Create spiral path points
  const getSpiralPoints = (startYear: number, endYear: number, verticalSpacing: number, revolutions: number) => {
    const points = []
    const numPoints = 200
    const totalHeight = philosophers.length * verticalSpacing
    
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints
      const angle = fraction * Math.PI * 2 * revolutions
      const radius = 180 + 250 * fraction
      const y = -totalHeight / 2 + totalHeight * fraction
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      points.push(new THREE.Vector3(x, y, z))
    }
    return points
  }

  // Get position on spiral based on birth year
  const yearToPosition = (year: number, startYear = -700, endYear = 2100) => {
    const path = new THREE.CatmullRomCurve3(getSpiralPoints(startYear, endYear, 50, 4))
    const fraction = (year - startYear) / (endYear - startYear)
    return path.getPointAt(Math.max(0, Math.min(1, fraction)))
  }

  // Create nebula background
  const createNebula = (scene: THREE.Scene) => {
    const nebulaGeometry = new THREE.PlaneGeometry(8000, 8000)
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0.0 }, 
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, 
        color1: { value: new THREE.Color(0x2a004f) }, 
        color2: { value: new THREE.Color(0x8a0256) } 
      },
      vertexShader: `
        varying vec2 vUv; 
        void main() { 
          vUv = uv; 
          gl_Position = vec4(position, 1.0); 
        }
      `,
      fragmentShader: `
        uniform vec2 resolution; 
        uniform float time; 
        uniform vec3 color1; 
        uniform vec3 color2; 
        varying vec2 vUv; 
        
        float random (in vec2 st) { 
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); 
        } 
        
        float noise (in vec2 st) { 
          vec2 i = floor(st); 
          vec2 f = fract(st); 
          float a = random(i); 
          float b = random(i + vec2(1.0, 0.0)); 
          float c = random(i + vec2(0.0, 1.0)); 
          float d = random(i + vec2(1.0, 1.0)); 
          vec2 u = f * f * (3.0 - 2.0 * f); 
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.y * u.x; 
        } 
        
        float fbm (in vec2 st) { 
          float value = 0.0; 
          float amplitude = .5; 
          for (int i = 0; i < 4; i++) { 
            value += amplitude * noise(st); 
            st *= 2.; 
            amplitude *= .5; 
          } 
          return value; 
        } 
        
        void main() { 
          vec2 st = vUv * 3.0; 
          st.x *= resolution.x / resolution.y; 
          vec2 q = vec2(fbm(st + 0.1 * time), fbm(st + vec2(1.0))); 
          vec2 r = vec2(fbm(st + q + 0.15 * time), fbm(st + q + 0.126 * time)); 
          float f = fbm(st + r); 
          vec3 color = mix(color1, color2, clamp((f*f)*2.5,0.0,1.0)); 
          gl_FragColor = vec4(color, f * 0.5 + 0.5); 
        }
      `,
      depthWrite: false, 
      transparent: true, 
      blending: THREE.AdditiveBlending
    })
    
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial)
    nebula.position.z = -3000
    nebulaRef.current = nebula
    scene.add(nebula)
  }

  // Create starfield
  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 2.0, 
      transparent: true, 
      opacity: 0.8, 
      blending: THREE.AdditiveBlending 
    })
    
    const starVertices = []
    for (let i = 0; i < 20000; i++) {
      const x = THREE.MathUtils.randFloatSpread(6000)
      const y = THREE.MathUtils.randFloatSpread(6000)
      const z = THREE.MathUtils.randFloatSpread(6000)
      if (new THREE.Vector3(x, y, z).length() > 800) {
        starVertices.push(x, y, z)
      }
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))
    const starfield = new THREE.Points(starGeometry, starMaterial)
    starfieldRef.current = starfield
    scene.add(starfield)
  }

  // Create spiral visualization
  const createSpiral = (scene: THREE.Scene) => {
    const path = new THREE.CatmullRomCurve3(getSpiralPoints(-700, 2100, 50, 4))
    const geometry = new THREE.TubeGeometry(path, 512, 1.5, 12, false)
    
    // Add progress attribute for color gradient
    const progress = new Float32Array(geometry.attributes.position.count)
    for (let i = 0; i < 512 + 1; i++) {
      const t = i / 512
      for (let j = 0; j < 12 + 1; j++) {
        const index = i * (12 + 1) + j
        progress[index] = t
      }
    }
    geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: { 
        colors: { 
          value: [
            new THREE.Color(0xd2b48c), // Beige
            new THREE.Color(0x8A2BE2), // Purple
            new THREE.Color(0xFF0000), // Red
            new THREE.Color(0x0000FF), // Blue
            new THREE.Color(0xFFA500), // Orange
            new THREE.Color(0x008000), // Green
            new THREE.Color(0xFFFF00), // Yellow
            new THREE.Color(0x40E0D0)  // Turquoise
          ] 
        }, 
        time: { value: 0.0 } 
      },
      vertexShader: `
        attribute float progress; 
        varying float vProgress; 
        void main() { 
          vProgress = progress; 
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
      `,
      fragmentShader: `
        uniform vec3 colors[8]; 
        uniform float time; 
        varying float vProgress; 
        
        vec3 getColor(float p) { 
          float pos = p * 7.0; 
          int index = int(floor(pos)); 
          float frac = pos - float(index); 
          return mix(colors[index], colors[clamp(index + 1, 0, 7)], frac); 
        } 
        
        void main() { 
          float pulse = sin(vProgress * 30.0 - time * 1.5) * 0.15 + 0.85; 
          vec3 color = getColor(vProgress) * pulse; 
          gl_FragColor = vec4(color, 0.75); 
        }
      `,
      transparent: true, 
      side: THREE.DoubleSide, 
      blending: THREE.AdditiveBlending
    })
    
    const spiralMesh = new THREE.Mesh(geometry, material)
    spiralMeshRef.current = spiralMesh
    scene.add(spiralMesh)
  }

  // Create philosopher nodes using instanced mesh
  const createPhilosopherNodes = (scene: THREE.Scene) => {
    if (!philosophers || philosophers.length === 0) return

    const philosopherGeometry = new THREE.SphereGeometry(8, 32, 32)
    const philosopherMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        domainColors: { 
          value: Object.values(domainColorValues)
        },
        viewVector: { value: cameraRef.current?.position || new THREE.Vector3() }
      },
      vertexShader: `
        attribute float domainIndex;
        attribute float birthYear;
        attribute float visibility;
        attribute float selected;
        
        varying vec3 vColor;
        varying float vVisibility;
        varying float vSelected;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        uniform vec3 domainColors[5];
        uniform float time;
        
        void main() {
          vColor = domainColors[int(domainIndex)];
          vVisibility = visibility;
          vSelected = selected;
          vNormal = normalize(normalMatrix * normal);
          
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vViewPosition = mvPosition.xyz;
          
          // Add gentle floating animation
          mvPosition.y += sin(time + float(gl_InstanceID) * 0.1) * 0.5 * visibility;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 viewVector;
        uniform float time;
        
        varying vec3 vColor;
        varying float vVisibility;
        varying float vSelected;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          if (vVisibility < 0.5) discard;
          
          // Calculate fresnel effect for glow
          vec3 viewDirection = normalize(-vViewPosition);
          float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
          
          // Base color with glow
          vec3 finalColor = vColor;
          finalColor += vColor * fresnel * 2.0;
          
          // Add selection highlight
          if (vSelected > 0.5) {
            finalColor += vec3(0.3) * sin(time * 5.0) * 0.5 + 0.5;
          }
          
          gl_FragColor = vec4(finalColor, vVisibility * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(
      philosopherGeometry,
      philosopherMaterial,
      philosophers.length
    )
    
    // Set up per-instance attributes
    const domainIndices = new Float32Array(philosophers.length)
    const birthYears = new Float32Array(philosophers.length)
    const visibilities = new Float32Array(philosophers.length)
    const selected = new Float32Array(philosophers.length)
    
    philosophers.forEach((philosopher: any, i: number) => {
      const domainIndex = domains.indexOf(philosopher.primaryDomain.toLowerCase())
      domainIndices[i] = domainIndex !== -1 ? domainIndex : 0
      birthYears[i] = philosopher.birthYear || 0
      visibilities[i] = 1.0
      selected[i] = 0.0
      
      // Calculate position on spiral
      const position = yearToPosition(philosopher.birthYear || 0)
      philosopherPositionsRef.current.set(philosopher.id, position)
      
      // Set instance matrix
      const matrix = new THREE.Matrix4()
      matrix.setPosition(position)
      instancedMesh.setMatrixAt(i, matrix)
    })
    
    // Add attributes to geometry
    instancedMesh.geometry.setAttribute('domainIndex', 
      new THREE.InstancedBufferAttribute(domainIndices, 1))
    instancedMesh.geometry.setAttribute('birthYear', 
      new THREE.InstancedBufferAttribute(birthYears, 1))
    instancedMesh.geometry.setAttribute('visibility', 
      new THREE.InstancedBufferAttribute(visibilities, 1))
    instancedMesh.geometry.setAttribute('selected', 
      new THREE.InstancedBufferAttribute(selected, 1))
    
    instancedMesh.instanceMatrix.needsUpdate = true
    instancedMeshRef.current = instancedMesh
    scene.add(instancedMesh)
    
    // Add connection lines group
    scene.add(connectionLinesRef.current)
  }

  // Show connections between philosophers
  const showPhilosopherConnections = (philosopher: any) => {
    // Clear existing connections
    connectionLinesRef.current.clear()
    
    if (!philosopher.influencedBy || philosopher.influencedBy.length === 0) return
    
    const startPos = philosopherPositionsRef.current.get(philosopher.id)
    if (!startPos) return
    
    philosopher.influencedBy.forEach((influence: any) => {
      const endPos = philosopherPositionsRef.current.get(influence.id)
      if (!endPos) return
      
      const points = [startPos, endPos]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.7, 
        blending: THREE.AdditiveBlending 
      })
      
      const line = new THREE.Line(geometry, material)
      connectionLinesRef.current.add(line)
    })
  }

  // Update visibility based on filters
  const updateVisibility = () => {
    if (!instancedMeshRef.current || !philosophers) return
    
    const visibilityAttr = instancedMeshRef.current.geometry.getAttribute('visibility') as THREE.InstancedBufferAttribute
    const selectedAttr = instancedMeshRef.current.geometry.getAttribute('selected') as THREE.InstancedBufferAttribute
    
    philosophers.forEach((philosopher: any, i: number) => {
      const isVisible = visiblePhilosophers.has(philosopher.id) ? 1.0 : 0.0
      const isSelected = selectedPhilosopher?.id === philosopher.id ? 1.0 : 0.0
      
      visibilityAttr.setX(i, isVisible)
      selectedAttr.setX(i, isSelected)
    })
    
    visibilityAttr.needsUpdate = true
    selectedAttr.needsUpdate = true
  }

  // Handle mouse move
  const handleMouseMove = (event: MouseEvent) => {
    if (!mountRef.current) return
    
    const rect = mountRef.current.getBoundingClientRect()
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  // Handle click with enhanced raycasting for instanced mesh
  const handleClick = (event: MouseEvent) => {
    if (!instancedMeshRef.current || !cameraRef.current || !philosophers) return
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    
    // Custom raycasting for instanced mesh
    const intersects = []
    const tempMatrix = new THREE.Matrix4()
    const tempSphere = new THREE.Sphere()
    
    for (let i = 0; i < philosophers.length; i++) {
      instancedMeshRef.current.getMatrixAt(i, tempMatrix)
      tempSphere.center.setFromMatrixPosition(tempMatrix)
      tempSphere.radius = 0.08
      
      if (raycasterRef.current.ray.intersectsSphere(tempSphere)) {
        intersects.push({
          instanceId: i,
          philosopher: philosophers[i],
          distance: raycasterRef.current.ray.origin.distanceTo(tempSphere.center)
        })
      }
    }
    
    if (intersects.length > 0) {
      // Sort by distance and select closest
      intersects.sort((a, b) => a.distance - b.distance)
      selectPhilosopher(intersects[0].philosopher)
      showPhilosopherConnections(intersects[0].philosopher)
      
      // Animate camera to philosopher
      const targetPosition = philosopherPositionsRef.current.get(intersects[0].philosopher.id)
      if (targetPosition && controlsRef.current) {
        const cameraOffset = new THREE.Vector3(100, 50, 100)
        const targetCameraPos = targetPosition.clone().add(cameraOffset)
        
        gsap.to(cameraRef.current.position, {
          x: targetCameraPos.x,
          y: targetCameraPos.y,
          z: targetCameraPos.z,
          duration: 1.5,
          ease: "power2.inOut"
        })
        
        gsap.to(controlsRef.current.target, {
          x: targetPosition.x,
          y: targetPosition.y,
          z: targetPosition.z,
          duration: 1.5,
          ease: "power2.inOut"
        })
      }
    }
  }

  // Handle window resize
  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current || !labelRendererRef.current) return
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
    
    rendererRef.current.setSize(width, height)
    labelRendererRef.current.setSize(width, height)
    
    if (composerRef.current) {
      composerRef.current.setSize(width, height)
    }
    
    if (nebulaRef.current && nebulaRef.current.material instanceof THREE.ShaderMaterial) {
      nebulaRef.current.material.uniforms.resolution.value.set(width, height)
    }
  }

  // Timeline change handler
  const handleTimelineChange = (year: number) => {
    if (!cameraRef.current || !controlsRef.current) return
    
    const targetPos = yearToPosition(year)
    
    gsap.to(controlsRef.current.target, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: "power2.out"
    })
    
    gsap.to(cameraRef.current.position, {
      x: targetPos.x + 150,
      y: targetPos.y + 50,
      z: targetPos.z + 150,
      duration: 0.8,
      ease: "power2.out"
    })
  }
  
  // Function to create DNA backbone
  const addDNABackbone = () => {
    if (!sceneRef.current) return
    
    const backbone = new THREE.Group()
    backbone.name = 'dnaBackbone'
    
    // Create the two strands
    const strand1Points = []
    const strand2Points = []
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100
      const angle = t * Math.PI * 2 * 6
      const y = (t - 0.5) * 20
      
      strand1Points.push(new THREE.Vector3(
        Math.cos(angle) * 4, y, Math.sin(angle) * 4
      ))
      strand2Points.push(new THREE.Vector3(
        Math.cos(angle + Math.PI) * 6, y, Math.sin(angle + Math.PI) * 6
      ))
    }
    
    // Create tube geometries
    const curve1 = new THREE.CatmullRomCurve3(strand1Points)
    const curve2 = new THREE.CatmullRomCurve3(strand2Points)
    
    const tubeGeometry = new THREE.TubeGeometry(curve1, 200, 0.1, 8)
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x224488,
      transparent: true,
      opacity: 0.3
    })
    
    backbone.add(new THREE.Mesh(tubeGeometry, tubeMaterial))
    backbone.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 200, 0.1, 8),
      tubeMaterial
    ))
    
    // Add connecting rungs
    for (let i = 0; i < 50; i++) {
      const t = i / 49
      const p1 = curve1.getPointAt(t)
      const p2 = curve2.getPointAt(t)
      
      const rungGeometry = new THREE.CylinderGeometry(0.05, 0.05, p1.distanceTo(p2))
      const rung = new THREE.Mesh(rungGeometry, tubeMaterial)
      
      rung.position.copy(p1).lerp(p2, 0.5)
      rung.lookAt(p2)
      rung.rotateX(Math.PI / 2)
      
      backbone.add(rung)
    }
    
    sceneRef.current.add(backbone)
  }
  
  // Function to remove DNA backbone
  const removeDNABackbone = () => {
    if (!sceneRef.current) return
    const backbone = sceneRef.current.getObjectByName('dnaBackbone')
    if (backbone) {
      sceneRef.current.remove(backbone)
      backbone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }
  }

  // Animation loop
  const animate = () => {
    animationRef.current = requestAnimationFrame(animate)
    
    const time = performance.now() * 0.001
    
    // Update shader uniforms
    if (spiralMeshRef.current && spiralMeshRef.current.material instanceof THREE.ShaderMaterial) {
      spiralMeshRef.current.material.uniforms.time.value = time
    }
    
    if (nebulaRef.current && nebulaRef.current.material instanceof THREE.ShaderMaterial) {
      nebulaRef.current.material.uniforms.time.value = time / 5
    }
    
    if (starfieldRef.current && !isPaused) {
      starfieldRef.current.rotation.y += 0.00005 * speed
    }
    
    if (instancedMeshRef.current && instancedMeshRef.current.material instanceof THREE.ShaderMaterial) {
      instancedMeshRef.current.material.uniforms.time.value = time
      instancedMeshRef.current.material.uniforms.viewVector.value = cameraRef.current?.position || new THREE.Vector3()
    }
    
    // Handle transition animation
    if (isTransitioning && instancedMeshRef.current) {
      transitionProgressRef.current = Math.min(
        transitionProgressRef.current + 0.02,
        1.0
      )
      
      const easeProgress = easeInOutCubic(transitionProgressRef.current)
      
      philosophers.forEach((philosopher, i) => {
        const targetPos = targetPositionsRef.current.get(philosopher.id)
        if (!targetPos || !instancedMeshRef.current) return
        
        const currentMatrix = new THREE.Matrix4()
        instancedMeshRef.current.getMatrixAt(i, currentMatrix)
        
        const currentPos = new THREE.Vector3()
        currentPos.setFromMatrixPosition(currentMatrix)
        
        const newPos = currentPos.clone().lerp(targetPos.position, easeProgress)
        
        const newMatrix = new THREE.Matrix4()
        newMatrix.setPosition(newPos)
        instancedMeshRef.current.setMatrixAt(i, newMatrix)
      })
      
      instancedMeshRef.current.instanceMatrix.needsUpdate = true
      
      if (transitionProgressRef.current >= 1) {
        setIsTransitioning(false)
      }
    }
    
    // Update visibility
    updateVisibility()
    
    // Update Fractillion Trace System
    if (fractillionTraceRef.current && !isPaused) {
      fractillionTraceRef.current.update(0.016) // Approx 60fps deltaTime
    }
    
    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update()
    }
    
    // Render scene
    if (composerRef.current && quality !== 'low') {
      composerRef.current.render()
    } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
    
    // Render labels
    if (labelRendererRef.current && sceneRef.current && cameraRef.current) {
      labelRendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }

  // Watch for view mode changes
  useEffect(() => {
    if (!philosophers.length) return
    
    const newPositions = viewMode === 'helix' 
      ? calculateHelixLayout(philosophers)
      : calculateSpiralLayout(philosophers)
    
    targetPositionsRef.current = newPositions
    transitionProgressRef.current = 0
    setIsTransitioning(true)
    
    // Animate camera position
    const targetCameraPos = viewMode === 'helix'
      ? new THREE.Vector3(20, 0, 20)
      : new THREE.Vector3(0, 10, 20)
    
    if (cameraRef.current) {
      gsap.to(cameraRef.current.position, {
        x: targetCameraPos.x,
        y: targetCameraPos.y,
        z: targetCameraPos.z,
        duration: 2,
        ease: "power2.inOut"
      })
    }
    
    // Add/remove DNA backbone
    if (viewMode === 'helix') {
      setTimeout(addDNABackbone, 1000)
    } else {
      removeDNABackbone()
    }
  }, [viewMode, philosophers])

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !philosophers || philosophers.length === 0) return
    
    // Scene setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x01000A, 100, 5000)
    sceneRef.current = scene
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    )
    camera.position.set(0, 150, 600)
    cameraRef.current = camera
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: quality !== 'low',
      alpha: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)
    
    // Label renderer setup
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.pointerEvents = 'none'
    labelRendererRef.current = labelRenderer
    mountRef.current.appendChild(labelRenderer.domElement)
    
    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 50
    controls.maxDistance = 2000
    controls.maxPolarAngle = Math.PI / 2 + 0.5
    controls.minPolarAngle = Math.PI / 4
    controlsRef.current = controls
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)
    
    // Post-processing
    if (quality !== 'low') {
      const composer = new EffectComposer(renderer)
      const renderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)
      
      if (quality === 'high') {
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.5, // strength
          0.4, // radius
          0.85 // threshold
        )
        composer.addPass(bloomPass)
      }
      
      composerRef.current = composer
    }
    
    // Create scene elements
    createNebula(scene)
    createStarfield(scene)
    createSpiral(scene)
    createPhilosopherNodes(scene)
    
    // Initialize Fractillion Trace System
    const traceSystem = new FractillionTraceSystem(scene)
    traceSystem.setPositionResolver((id: string) => {
      return philosopherPositionsRef.current.get(id)
    })
    fractillionTraceRef.current = traceSystem
    
    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    mountRef.current.addEventListener('click', handleClick)
    
    // Start animation
    animate()
    setIsLoading(false)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      mountRef.current?.removeEventListener('click', handleClick)
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Dispose of Fractillion Trace System
      if (fractillionTraceRef.current) {
        fractillionTraceRef.current.dispose()
      }
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      
      renderer.dispose()
      labelRenderer.domElement.remove()
      renderer.domElement.remove()
    }
  }, [philosophers, quality, isPaused, speed])

  // Loading screen while data is fetching
  if (!philosophers || philosophers.length === 0 || isLoading) {
    return <LoadingScreen progress={100} isLoading={true} />
  }

  // Hide hint after 5 seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => setShowHint(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showHint])

  // Quality change handler (for future implementation)
  const handleQualityChange = (newQuality: 'high' | 'medium' | 'low') => {
    setQuality(newQuality)
    // Re-render scene with new quality settings
  }

  return (
    <>
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Welcome message */}
      {showWelcome && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 
                       bg-gray-900/90 backdrop-blur-md text-white p-6 rounded-lg shadow-2xl max-w-md"
          >
            <h2 className="text-2xl font-bold mb-3">Welcome to The Philosophical Nexus</h2>
            <p className="mb-4">
              Explore the spiral of philosophical thought across time. Each philosopher is positioned
              chronologically on the spiral, with connections showing influences.
            </p>
            <button
              onClick={() => {
                setShowWelcome(false)
                localStorage.setItem('philosophicalNexusVisited', 'true')
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Start Exploring
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Hint message */}
      {showHint && !showWelcome && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 
                       bg-gray-900/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg"
          >
            <p className="text-sm">
              Use mouse to navigate • Click philosophers to learn more • Scroll to zoom
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Top controls */}
      <div className="fixed top-4 right-4 z-40 flex gap-3">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-3 backdrop-blur-md bg-white/10 
                     border border-white/20 rounded-full text-white
                     hover:bg-white/20 transition-all duration-300 shadow-lg"
        >
          <Info size={20} />
        </button>
        
        <button
          onClick={() => setShowHelp(true)}
          className="p-3 backdrop-blur-md bg-white/10 
                     border border-white/20 rounded-full text-white
                     hover:bg-white/20 transition-all duration-300 shadow-lg"
        >
          <HelpCircle size={20} />
        </button>
        
        <button
          onClick={() => {
            const newMode = viewMode === 'orb' ? 'helix' : 'orb'
            setViewMode(newMode)
            handleTimelineChange(activeTimeRange[0])
          }}
          className="px-4 py-2 backdrop-blur-md bg-white/10 
                     border border-white/20 rounded-full text-white text-sm font-medium
                     hover:bg-white/20 transition-all duration-300"
        >
          {viewMode === 'orb' ? 'Timeline View' : 'Orb View'}
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="fixed top-16 right-4 z-40 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-lg font-bold mb-3">Spiral Legend</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-1">Domains</h4>
              <div className="space-y-1">
                {Object.entries(domainColorValues).map(([domain, color]) => (
                  <div key={domain} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: `#${color.getHexString()}` }}
                    />
                    <span className="text-xs capitalize">{domain}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Timeline</h4>
              <p className="text-xs">
                The spiral progresses chronologically from ancient (center) to contemporary (outer edge).
              </p>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
              <div className="space-y-1 text-xs">
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">Space</kbd> - Pause/Resume</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">L</kbd> - Toggle legend</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">?</kbd> - Help</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg">
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <div>
              <span className="text-gray-500">Philosophers:</span> {visiblePhilosophers.size}/{philosophers.length}
            </div>
            <div>
              <span className="text-gray-500">Period:</span> {activeTimeRange[0]} - {activeTimeRange[1]}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline slider */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 w-96">
        <input
          type="range"
          min="-700"
          max="2100"
          value={activeTimeRange[0]}
          onChange={(e) => {
            const year = parseInt(e.target.value)
            setActiveTimeRange([year, activeTimeRange[1]])
            handleTimelineChange(year)
          }}
          className="w-full"
        />
        <div className="text-center text-white text-sm mt-2">
          {Math.abs(activeTimeRange[0])} {activeTimeRange[0] < 0 ? 'BCE' : 'CE'}
        </div>
      </div>

      <Sidebar />

      {selectedPhilosopher && (
        <PhilosopherPanel 
          philosopher={selectedPhilosopher as any}
          domain={(selectedPhilosopher as any).primaryDomain || 'ethics'}
          index={0}
          totalPanels={1}
          onClose={() => selectPhilosopher(null)} 
        />
      )}

      {showHelp && <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />}
    </>
  )
}
