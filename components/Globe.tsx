"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer"
import { Color } from "three"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import Sidebar from "./Sidebar"
import InfoPanel from "./InfoPanel"
import LoadingScreen from "./LoadingScreen"
import HelpModal from "./HelpModal"
import {
  allPhilosophers,
  getBirthYear,
  domainColors,
  earliestBirthYear,
  latestBirthYear,
} from "@/app/data/allPhilosophers"
import type { PhilosopherData } from "@/app/types/philosopher"
import { Button } from "@/components/ui/button"
import { X, Info, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ParticleConnectionSystem } from "@/lib/ParticleConnections"
import { PhilosopherLODSystem, FrustumCullingSystem } from "@/lib/LODSystem"
import { KeyboardShortcutManager, createDefaultShortcuts } from "@/lib/KeyboardShortcuts"

interface SliceData {
  name: string
  color: string
  description: string
}

interface EraData {
  name: string
  period: string
  startYear: number
  endYear: number
}

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<PhilosopherData | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [isPaused, setIsPaused] = useState(false)
  const [viewMode, setViewMode] = useState<'orb' | 'helix'>('orb')
  const [showConnections, setShowConnections] = useState(false)
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [highlightedPhilosophers, setHighlightedPhilosophers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  // Welcome and help states
  const [showWelcome, setShowWelcome] = useState(() => 
    typeof window !== 'undefined' ? !localStorage.getItem('philosophicalNexusVisited') : false
  )

  const [activeTimeRange, setActiveTimeRange] = useState<[number, number]>([earliestBirthYear, latestBirthYear])
  const [visiblePhilosophers, setVisiblePhilosophers] = useState<PhilosopherData[]>(allPhilosophers)

  // New state for sidebar filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEras, setSelectedEras] = useState<string[]>([
    "Ancient", "Medieval", "Renaissance", "Early Modern", "Modern", "Contemporary"
  ])
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    "logic", "aesthetics", "ethics", "politics", "metaphysics"
  ])

  // Animation references
  const animationRef = useRef<number | null>(null)
  const slicesRef = useRef<THREE.Group[]>([])
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const labelRendererRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const philosopherGroupsRef = useRef<Map<string, THREE.Group>>(new Map())
  const yearLayersRef = useRef<Map<number, THREE.Group[]>>(new Map())
  const domainSlicesRef = useRef<THREE.Group[]>([])
  const dnaBackboneRef = useRef<THREE.Group | null>(null)
  const composerRef = useRef<any>(null)
  const nebulaRef = useRef<THREE.Group | null>(null)
  const particleSystemRef = useRef<ParticleConnectionSystem | null>(null)
  const philosopherPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())

  // New system refs
  const lodSystemRef = useRef<PhilosopherLODSystem | null>(null)
  const frustumCullingRef = useRef<FrustumCullingSystem | null>(null)
  const keyboardManagerRef = useRef<KeyboardShortcutManager | null>(null)

  // Philosophical domains
  const sliceData: SliceData[] = [
    {
      name: "Logic",
      color: domainColors.logic,
      description: "The study of valid reasoning and argumentation",
    },
    {
      name: "Aesthetics",
      color: domainColors.aesthetics,
      description: "The philosophy of beauty, art, and taste",
    },
    {
      name: "Ethics",
      color: domainColors.ethics,
      description: "The study of moral principles and values",
    },
    {
      name: "Politics",
      color: domainColors.politics,
      description: "The philosophy of governance and social organization",
    },
    {
      name: "Metaphysics",
      color: domainColors.metaphysics,
      description: "The study of reality, existence, and being",
    },
  ]

  // Historical eras
  const eras: EraData[] = [
    { name: "Ancient", period: "600 BCE - 500 CE", startYear: -600, endYear: 500 },
    { name: "Medieval", period: "500 - 1400 CE", startYear: 500, endYear: 1400 },
    { name: "Renaissance", period: "1400 - 1600 CE", startYear: 1400, endYear: 1600 },
    { name: "Early Modern", period: "1600 - 1800 CE", startYear: 1600, endYear: 1800 },
    { name: "Modern", period: "1800 - 1900 CE", startYear: 1800, endYear: 1900 },
    { name: "Contemporary", period: "1900 CE - Present", startYear: 1900, endYear: 2023 },
  ]

  // Get quality settings
  const getQualitySettings = () => ({
    high: { segments: 32, particles: 10000, bloom: true },
    medium: { segments: 16, particles: 5000, bloom: true },
    low: { segments: 8, particles: 1000, bloom: false }
  }[quality])

  // Get domain index
  const getDomainIndex = (domain: string): number => {
    const domainNames = sliceData.map(s => s.name.toLowerCase())
    return domainNames.indexOf(domain.toLowerCase())
  }

  // Calculate radius based on birth year (earlier = closer to center)
  const getRadiusForYear = (year: number): number => {
    const coreRadius = 1.5
    const maxRadius = 6
    const yearRange = latestBirthYear - earliestBirthYear
    if (yearRange === 0) return coreRadius // Avoid division by zero
    const normalizedYear = (year - earliestBirthYear) / yearRange
    return coreRadius + normalizedYear * (maxRadius - coreRadius)
  }

  // Get era for a given year
  const getEraForYear = (year: number): EraData | undefined => {
    return eras.find((era) => year >= era.startYear && year <= era.endYear)
  }

  // Create nebula clouds function
  const createNebulaClouds = () => {
    const nebula = new THREE.Group()
    const nebulaColors = [0x4488ff, 0x8844ff, 0xff4488]
    
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.SphereGeometry(Math.random() * 20 + 10, 16, 16)
      const material = new THREE.MeshBasicMaterial({
        color: nebulaColors[i],
        transparent: true,
        opacity: 0.02,
        side: THREE.BackSide,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 50
      )
      nebula.add(mesh)
    }
    
    return nebula
  }

  // Create custom shader material for philosophers
  const createPhilosopherMaterial = (color: string) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(color) },
        glowIntensity: { value: 0.3 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform float glowIntensity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Fresnel effect
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
          
          // Pulsing glow
          float pulse = sin(time * 2.0) * 0.1 + 0.9;
          
          vec3 color = baseColor;
          color += baseColor * fresnel * 2.0 * glowIntensity;
          color *= pulse;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true
    })
  }

  // Easing function for smooth transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  // Calculate helix positions for philosophers
  const calculateHelixPositions = (philosophers: PhilosopherData[]): Map<string, THREE.Vector3> => {
    const sorted = [...philosophers].sort((a, b) => getBirthYear(a) - getBirthYear(b))
    const positions = new Map<string, THREE.Vector3>()
    
    sorted.forEach((phil, index) => {
      const t = sorted.length > 1 ? index / (sorted.length - 1) : 0.5
      const angle = t * Math.PI * 12 // 6 full rotations
      const height = (t - 0.5) * 30 // Total height 30 units
      
      // Double helix - alternate strands
      const strand = index % 2
      const radius = 6 + (strand * 2)
      const phaseShift = strand * Math.PI
      
      positions.set(phil.id, new THREE.Vector3(
        Math.cos(angle + phaseShift) * radius,
        height,
        Math.sin(angle + phaseShift) * radius
      ))
    })
    
    return positions
  }

  // Calculate orb positions for philosophers
  const calculateOrbPositions = (philosophers: PhilosopherData[]): Map<string, THREE.Vector3> => {
    const positions = new Map<string, THREE.Vector3>()
    const sliceAngle = (Math.PI * 2) / sliceData.length
    
    philosophers.forEach((philosopher) => {
      const birthYear = getBirthYear(philosopher)
      let positionSet = false
      
      Object.keys(philosopher.domainSummaries).forEach((domain) => {
        if (!positionSet) {
          const domainIndex = getDomainIndex(domain)
          if (domainIndex === -1) return
          
          const radius = getRadiusForYear(birthYear)
          const angle = domainIndex * sliceAngle + sliceAngle / 2 + (Math.random() - 0.5) * sliceAngle * 0.5
          const heightVariation = (Math.random() - 0.5) * 0.5
          const x = Math.sin(angle) * radius
          const y = heightVariation
          const z = Math.cos(angle) * radius
          
          positions.set(philosopher.id, new THREE.Vector3(x, y, z))
          positionSet = true
        }
      })
    })
    
    return positions
  }

  // Add DNA backbone when in helix mode
  const addDNABackbone = () => {
    if (!sceneRef.current || dnaBackboneRef.current) return
    
    const backbone = new THREE.Group()
    
    // Create spiral curves for the two strands
    const points1: THREE.Vector3[] = []
    const points2: THREE.Vector3[] = []
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100
      const angle = t * Math.PI * 12
      const height = (t - 0.5) * 30
      
      points1.push(new THREE.Vector3(
        Math.cos(angle) * 6,
        height,
        Math.sin(angle) * 6
      ))
      
      points2.push(new THREE.Vector3(
        Math.cos(angle + Math.PI) * 8,
        height,
        Math.sin(angle + Math.PI) * 8
      ))
    }
    
    // Create curves
    const curve1 = new THREE.CatmullRomCurve3(points1)
    const curve2 = new THREE.CatmullRomCurve3(points2)
    
    // Create tube geometries
    const tubeGeometry1 = new THREE.TubeGeometry(curve1, 200, 0.1, 8, false)
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 200, 0.1, 8, false)
    
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      emissive: 0x224488,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.3,
    })
    
    const tube1 = new THREE.Mesh(tubeGeometry1, tubeMaterial)
    const tube2 = new THREE.Mesh(tubeGeometry2, tubeMaterial)
    
    backbone.add(tube1)
    backbone.add(tube2)
    
    // Add connecting bars between strands
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const angle = t * Math.PI * 12
      const height = (t - 0.5) * 30
      
      const start = new THREE.Vector3(
        Math.cos(angle) * 6,
        height,
        Math.sin(angle) * 6
      )
      
      const end = new THREE.Vector3(
        Math.cos(angle + Math.PI) * 8,
        height,
        Math.sin(angle + Math.PI) * 8
      )
      
      const direction = new THREE.Vector3().subVectors(end, start)
      const length = direction.length()
      direction.normalize()
      
      const barGeometry = new THREE.CylinderGeometry(0.05, 0.05, length)
      const barMaterial = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        emissive: 0x448899,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.4,
      })
      
      const bar = new THREE.Mesh(barGeometry, barMaterial)
      bar.position.copy(start).add(direction.multiplyScalar(length / 2))
      bar.lookAt(end)
      bar.rotateX(Math.PI / 2)
      
      backbone.add(bar)
    }
    
    sceneRef.current.add(backbone)
    dnaBackboneRef.current = backbone
  }

  // Remove DNA backbone
  const removeDNABackbone = () => {
    if (dnaBackboneRef.current && sceneRef.current) {
      sceneRef.current.remove(dnaBackboneRef.current)
      dnaBackboneRef.current = null
    }
  }

  // Jump to philosopher with camera animation
  const jumpToPhilosopher = (philosopher: PhilosopherData) => {
    if (!cameraRef.current || !controlsRef.current) return
    
    // Find the philosopher's position
    const philosopherGroup = philosopherGroupsRef.current.get(philosopher.id)
    if (!philosopherGroup || philosopherGroup.children.length === 0) return
    
    // Get the first mesh position
    const firstMesh = philosopherGroup.children.find(child => child instanceof THREE.Mesh)
    if (!firstMesh) return
    
    // Calculate camera target position
    const targetPosition = firstMesh.position.clone()
    const cameraDistance = 3
    const cameraOffset = new THREE.Vector3(
      cameraDistance * Math.sin(Date.now() * 0.001),
      cameraDistance * 0.5,
      cameraDistance * Math.cos(Date.now() * 0.001)
    )
    
    const startCameraPos = cameraRef.current.position.clone()
    const targetCameraPos = targetPosition.clone().add(cameraOffset)
    const startTarget = controlsRef.current.target.clone()
    
    const duration = 1500
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(progress)
      
      if (cameraRef.current && controlsRef.current) {
        // Animate camera position
        cameraRef.current.position.lerpVectors(startCameraPos, targetCameraPos, eased)
        
        // Animate controls target
        controlsRef.current.target.lerpVectors(startTarget, targetPosition, eased)
        controlsRef.current.update()
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Select the philosopher after animation
        setSelectedPhilosopher(philosopher)
        
        // Find and set the domain slice
        const domain = Object.keys(philosopher.domainSummaries)[0]
        if (domain) {
          const domainIndex = getDomainIndex(domain)
          if (domainIndex !== -1) setSelectedSlice(domainIndex)
        }
      }
    }
    
    animate()
  }

  // Transform to view
  const transformToView = (mode: 'orb' | 'helix') => {
    if (!cameraRef.current || !sceneRef.current) return
    
    const duration = 3000
    
    // Calculate target positions
    const targetPositions = mode === 'helix' 
      ? calculateHelixPositions(allPhilosophers)
      : calculateOrbPositions(allPhilosophers)
    
    // Store current positions
    const startPositions = new Map<string, THREE.Vector3>()
    philosopherGroupsRef.current.forEach((group, id) => {
      // Get first philosopher mesh position
      const firstMesh = group.children.find(child => child instanceof THREE.Mesh)
      if (firstMesh) {
        startPositions.set(id, firstMesh.position.clone())
      }
    })
    
    // Animate camera
    const startCameraPos = cameraRef.current.position.clone()
    const targetCameraPos = mode === 'helix' 
      ? new THREE.Vector3(25, 10, 25)
      : new THREE.Vector3(0, 5, 12)
    
    const animate = () => {
      if (!cameraRef.current) return
      
      const elapsed = Date.now() * 0.001 // Time in seconds
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(progress)
      
      // Update philosopher positions
      philosopherGroupsRef.current.forEach((group, id) => {
        const start = startPositions.get(id)
        const target = targetPositions.get(id)
        if (start && target) {
          // Move all meshes in the group to the same position
          group.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
              child.position.lerpVectors(start, target, eased)
            }
          })
        }
      })
      
      // Update camera
      cameraRef.current.position.lerpVectors(startCameraPos, targetCameraPos, eased)
      cameraRef.current.lookAt(0, 0, 0)
      
      // Hide/show elements based on view
      if (mode === 'helix') {
        // Fade out domain slices and era shells
        domainSlicesRef.current.forEach(group => {
          group.visible = progress < 0.5
        })
        yearLayersRef.current.forEach(layers => {
          layers.forEach(layer => {
            layer.visible = progress < 0.5
          })
        })
        slicesRef.current.forEach(slice => {
          slice.visible = progress < 0.5
        })
      } else {
        // Fade in domain slices
        domainSlicesRef.current.forEach(group => {
          group.visible = progress > 0.5
        })
        yearLayersRef.current.forEach(layers => {
          layers.forEach(layer => {
            layer.visible = progress > 0.5
          })
        })
        slicesRef.current.forEach(slice => {
          slice.visible = progress > 0.5
        })
        
        // Remove DNA backbone when transitioning to orb
        if (progress > 0.9) {
          removeDNABackbone()
        }
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Add DNA backbone if in helix mode
        if (mode === 'helix') {
          addDNABackbone()
        }
      }
    }
    
    animate()
  }

  // Effect to filter philosophers when activeTimeRange changes
  useEffect(() => {
    const [startYear, endYear] = activeTimeRange
    const highlighted = new Set<string>()
    
    const filtered = allPhilosophers.filter((p) => {
      const birth = getBirthYear(p)
      // Consider death year if available, otherwise assume active until latest possible year for filtering
      const death = p.death
        ? typeof p.death === "string"
          ? Number.parseInt(p.death.replace("c. ", ""))
          : p.death
        : latestBirthYear
      
      // Time range filter
      const inTimeRange = birth <= endYear && death >= startYear
      
      // Era filter
      const inSelectedEra = selectedEras.includes(p.era)
      
      // Domain filter - check if philosopher has content in at least one selected domain
      const hasSelectedDomain = selectedDomains.some(domain => 
        p.domainSummaries[domain as keyof typeof p.domainSummaries] && 
        p.domainSummaries[domain as keyof typeof p.domainSummaries].length > 0
      )
      
      // Search filter
      const matchesSearch = searchQuery === "" || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(p.domainSummaries).some(summary => 
          summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
      
      // Track which philosophers match the search for highlighting
      if (searchQuery && matchesSearch) {
        highlighted.add(p.id)
      }
      
      return inTimeRange && inSelectedEra && hasSelectedDomain && matchesSearch
    })
    
    setVisiblePhilosophers(filtered)
    setHighlightedPhilosophers(highlighted)
  }, [activeTimeRange, selectedEras, selectedDomains, searchQuery])

  // Keyboard shortcut callbacks
  const keyboardCallbacks = {
    togglePause: () => setIsPaused(prev => !prev),
    toggleHelp: () => setShowHelp(prev => !prev),
    toggleLegend: () => setShowLegend(prev => !prev),
    toggleConnections: () => setShowConnections(prev => !prev),
    resetCamera: () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 5, 12)
        cameraRef.current.lookAt(0, 0, 0)
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
    },
    toggleViewMode: () => setViewMode(prev => prev === 'orb' ? 'helix' : 'orb'),
    increaseSpeed: () => setSpeed(prev => Math.min(prev + 0.5, 5)),
    decreaseSpeed: () => setSpeed(prev => Math.max(prev - 0.5, 0)),
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    },
    search: () => {
      // Focus the search input in the sidebar
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }
  }

  // Initialize keyboard shortcuts
  useEffect(() => {
    const keyboardManager = new KeyboardShortcutManager()
    const shortcuts = createDefaultShortcuts(keyboardCallbacks)
    
    shortcuts.forEach(shortcut => {
      keyboardManager.register(shortcut)
    })
    
    keyboardManagerRef.current = keyboardManager
    
    return () => {
      keyboardManager.dispose()
    }
  }, [])

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Start loading
    setLoadingProgress(0)
    setIsLoading(true)
    
    const qualitySettings = getQualitySettings()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera

    // Initialize LOD and frustum culling systems
    const lodSystem = new PhilosopherLODSystem()
    lodSystem.setCamera(camera)
    lodSystemRef.current = lodSystem
    
    const frustumCulling = new FrustumCullingSystem()
    frustumCullingRef.current = frustumCulling

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = false
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    setLoadingProgress(10)

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.domElement.style.position = "absolute"
    labelRenderer.domElement.style.top = "0px"
    labelRenderer.domElement.style.pointerEvents = "none"
    mountRef.current.appendChild(labelRenderer.domElement)
    labelRendererRef.current = labelRenderer

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = qualitySettings.particles
    const positions = new Float32Array(starsCount * 3)
    const colors = new Float32Array(starsCount * 3)
    const sizes = new Float32Array(starsCount)
    
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
      
      // Add some color variation
      const color = new THREE.Color()
      color.setHSL(0.6 + Math.random() * 0.2, 0.3, 0.5 + Math.random() * 0.5)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      sizes[i] = Math.random() * 2 + 0.5
    }
    
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1))
    
    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float pixelRatio;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5, 0.5));
          if (r > 0.5) discard;
          
          float opacity = 1.0 - smoothstep(0.0, 0.5, r);
          gl_FragColor = vec4(vColor, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    // Initialize particle connection system
    const particleSystem = new ParticleConnectionSystem(scene)
    particleSystemRef.current = particleSystem

    // Add nebula clouds for atmosphere
    const nebula = createNebulaClouds()
    scene.add(nebula)
    nebulaRef.current = nebula
    
    setLoadingProgress(20)

    // Create the core orb structure
    const orbGroup = new THREE.Group()
    orbGroup.name = "PhilosophicalOrb"
    
    // Create core sphere
    const coreGeometry = new THREE.SphereGeometry(1.5, qualitySettings.segments * 2, qualitySettings.segments)
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x0a0a1e,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
    })
    const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial)
    orbGroup.add(coreSphere)
    
    // Create outer glow sphere
    const glowGeometry = new THREE.SphereGeometry(6.5, qualitySettings.segments * 2, qualitySettings.segments)
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d3561,
      emissive: 0x1e2444,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    })
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
    orbGroup.add(glowSphere)

    // Create domain segments as overlays on the single orb
    const sliceAngle = (Math.PI * 2) / sliceData.length
    const sliceGap = 0.02

    // Create time rings
    for (let i = 0; i < 5; i++) {
      const ringRadius = 1.5 + (i * 1.0)
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.02, 8, qualitySettings.segments * 2)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.2,
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      orbGroup.add(ring)
    }

    // Create domain visual indicators
    sliceData.forEach((slice, sliceIndex) => {
      const sliceGroup = new THREE.Group()
      sliceGroup.userData = { index: sliceIndex, name: slice.name }
      
      // Create domain meridian lines
      const curve = new THREE.EllipseCurve(
        0, 0,            // center
        6, 6,            // radius
        sliceIndex * sliceAngle + sliceAngle / 2,  // start angle
        sliceIndex * sliceAngle + sliceAngle / 2,  // end angle (same as start for a meridian)
        false,           // clockwise
        0                // rotation
      )
      
      const points = curve.getPoints(50)
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      )
      
      // Create a tube for the meridian
      const meridianCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 6, 0),
        new THREE.Vector3(Math.sin(sliceIndex * sliceAngle + sliceAngle / 2) * 6, 0, Math.cos(sliceIndex * sliceAngle + sliceAngle / 2) * 6),
        new THREE.Vector3(0, -6, 0)
      ])
      
      const tubeGeometry = new THREE.TubeGeometry(meridianCurve, 20, 0.05, 8, false)
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: new Color(slice.color),
        emissive: new Color(slice.color),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.5,
      })
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
      sliceGroup.add(tube)
      
      orbGroup.add(sliceGroup)
      domainSlicesRef.current.push(sliceGroup)
    })
    
    scene.add(orbGroup)

    setLoadingProgress(40)

    sliceData.forEach((slice, sliceIndex) => {
      const labelDiv = document.createElement("div")
      labelDiv.className = "domain-label"
      labelDiv.textContent = slice.name
      labelDiv.style.cssText = `color: white; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; padding: 4px 8px; background: rgba(0, 0, 0, 0.7); border: 1px solid ${slice.color}; border-radius: 4px; white-space: nowrap; user-select: none; transition: all 0.3s ease;`
      const label = new CSS2DObject(labelDiv)
      const labelAngle = sliceIndex * sliceAngle + sliceAngle / 2
      const labelRadius = 7
      label.position.set(Math.sin(labelAngle) * labelRadius, 0, Math.cos(labelAngle) * labelRadius)
      const labelGroup = new THREE.Group()
      labelGroup.add(label)
      labelGroup.userData = { type: "domainLabel", index: sliceIndex, name: slice.name }
      slicesRef.current.push(labelGroup)
      scene.add(labelGroup)
    })

    allPhilosophers.forEach((philosopher) => {
      const philosopherGroup = new THREE.Group()
      const birthYear = getBirthYear(philosopher)
      philosopherGroup.userData = {
        philosopherId: philosopher.id,
        philosopherName: philosopher.name,
        birthYear: birthYear,
        targetOpacity: 1.0,
        isVisible: true,
      }
      philosopherGroupsRef.current.set(philosopher.id, philosopherGroup)
      scene.add(philosopherGroup)
      Object.keys(philosopher.domainSummaries).forEach((domain) => {
        const domainIndex = getDomainIndex(domain)
        if (domainIndex === -1) return
        const radius = getRadiusForYear(birthYear)
        const angle = domainIndex * sliceAngle + sliceAngle / 2 + (Math.random() - 0.5) * sliceAngle * 0.5
        const heightVariation = (Math.random() - 0.5) * 0.5
        const x = Math.sin(angle) * radius
        const y = heightVariation
        const z = Math.cos(angle) * radius
        const philosopherGeometry = new THREE.SphereGeometry(0.08, qualitySettings.segments / 4, qualitySettings.segments / 4)
        const material = createPhilosopherMaterial(sliceData[domainIndex].color)
        const mesh = new THREE.Mesh(philosopherGeometry, material)
        mesh.position.set(x, y, z)
        mesh.userData = {
          philosopherId: philosopher.id,
          philosopherName: philosopher.name,
          domain: domain,
          era: philosopher.era,
          birthYear: birthYear,
        }
        const nameDiv = document.createElement("div")
        nameDiv.className = "philosopher-name"
        nameDiv.textContent = philosopher.name
        nameDiv.style.cssText = `color: white; font-family: Arial, sans-serif; font-size: 12px; padding: 3px 6px; background: rgba(0, 0, 0, 0.8); border-radius: 4px; white-space: nowrap; user-select: none; opacity: 0; transition: opacity 0.2s ease;`
        const nameLabel = new CSS2DObject(nameDiv)
        nameLabel.position.set(0, 0.15, 0)
        mesh.add(nameLabel)
        philosopherGroup.add(mesh)
      })
    })

    setLoadingProgress(60)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(10, 10, 10)
    scene.add(pointLight)

    camera.position.set(0, 5, 12)
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.minDistance = 5
    controls.maxDistance = 50
    controlsRef.current = controls

    setLoadingProgress(80)

    // Set up post-processing
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    if (qualitySettings.bloom) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // intensity
        0.6, // threshold
        0.9  // smoothing
      )
      composer.addPass(bloomPass)
    }

    // Chromatic aberration effect
    const chromaticAberrationShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: new THREE.Vector2(0.002, 0.002) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 offset;
        varying vec2 vUv;
        void main() {
          vec2 r = vUv + offset;
          vec2 g = vUv;
          vec2 b = vUv - offset;
          gl_FragColor = vec4(
            texture2D(tDiffuse, r).r,
            texture2D(tDiffuse, g).g,
            texture2D(tDiffuse, b).b,
            1.0
          );
        }
      `
    }
    const chromaticPass = new ShaderPass(chromaticAberrationShader)
    composer.addPass(chromaticPass)

    // Vignette effect
    const vignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        darkness: { value: 0.4 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float dist = distance(vUv, vec2(0.5, 0.5));
          color.rgb *= 1.0 - darkness * smoothstep(0.45, 0.8, dist);
          gl_FragColor = color;
        }
      `
    }
    const vignettePass = new ShaderPass(vignetteShader)
    composer.addPass(vignettePass)

    composerRef.current = composer

    // Simulate loading completion
    setTimeout(() => {
      setLoadingProgress(100)
    }, 1000)

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    const handleClick = () => {
      if (!cameraRef.current || !sceneRef.current) return
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)
      if (intersects.length > 0) {
        const object = intersects[0].object
        if (object.userData.philosopherId) {
          const philosopher = allPhilosophers.find((p) => p.id === object.userData.philosopherId)
          if (philosopher) {
            setSelectedPhilosopher(philosopher)
            const domainIndex = getDomainIndex(object.userData.domain)
            if (domainIndex !== -1) setSelectedSlice(domainIndex)
          }
        } else if (object.userData.sliceIndex !== undefined) {
          setSelectedSlice(object.userData.sliceIndex)
          setSelectedPhilosopher(null)
        }
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && labelRendererRef.current && composerRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
        labelRendererRef.current.setSize(window.innerWidth, window.innerHeight)
        composerRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener("resize", handleResize)
    const hintTimer = setTimeout(() => setShowHint(false), 3000)

    // Create particle connections after all philosophers are positioned
    setTimeout(() => {
      if (particleSystemRef.current) {
        allPhilosophers.forEach(philosopher => {
          if (philosopher.influences && philosopher.influences.length > 0) {
            philosopher.influences.forEach(influenceId => {
              const influencer = allPhilosophers.find(p => p.id === influenceId)
              if (!influencer) return
              
              const fromPos = philosopherPositionsRef.current.get(influencer.id)
              const toPos = philosopherPositionsRef.current.get(philosopher.id)
              
              if (fromPos && toPos) {
                particleSystemRef.current.addConnection(
                  influencer.id,
                  philosopher.id,
                  fromPos,
                  toPos,
                  'influence'
                )
              }
            })
          }
        })
      }
    }, 500)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (mountRef.current && rendererRef.current && labelRendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        mountRef.current.removeChild(labelRendererRef.current.domElement)
      }
      if (controlsRef.current) controlsRef.current.dispose()
      clearTimeout(hintTimer)
      lodSystem.dispose()
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !controlsRef.current ||
      !labelRendererRef.current
    )
      return

    const visiblePhilosopherIds = new Set(visiblePhilosophers.map((p) => p.id))

    philosopherGroupsRef.current.forEach((group, id) => {
      const isVisible = visiblePhilosopherIds.has(id)
      group.userData.isVisible = isVisible
    })

    const animate = () => {
      if (!isPaused) {
        animationRef.current = requestAnimationFrame(animate)
      }

      const elapsed = Date.now() * 0.001

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (sceneRef.current && !isPaused) {
        sceneRef.current.rotation.y += 0.0002 * speed
      }

      if (particleSystemRef.current && !isPaused) {
        particleSystemRef.current.update(0.016 * speed)
      }

      if (nebulaRef.current && !isPaused) {
        nebulaRef.current.rotation.y += 0.0001 * speed
        nebulaRef.current.rotation.x += 0.00005 * speed
      }

      if (cameraRef.current && sceneRef.current && frustumCullingRef.current && lodSystemRef.current) {
        // Update frustum culling system
        frustumCullingRef.current.updateFrustum(cameraRef.current)
        
        // Update object bounds for frustum culling
        philosopherGroupsRef.current.forEach((group, id) => {
          if (group.children.length > 0) {
            frustumCullingRef.current!.updateObjectBounds(id, group)
          }
        })
        
        // Batch visibility check
        const philosopherIds = Array.from(philosopherGroupsRef.current.keys())
        const visibilityResults = frustumCullingRef.current.checkVisibilityBatch(philosopherIds)
        
        // Apply visibility and LOD updates
        philosopherGroupsRef.current.forEach((group, id) => {
          const inFrustum = visibilityResults.get(id) || false
          group.visible = inFrustum && group.userData.isVisible
          
          // Apply LOD to visible philosophers
          if (group.visible) {
            group.children.forEach(child => {
              if (child instanceof THREE.Mesh) {
                const lodLevel = lodSystemRef.current!.getLODLevel(child)
                lodSystemRef.current!.updatePhilosopherLOD(child, lodLevel)
                
                // Update shader uniforms for animations
                if (child.material instanceof THREE.ShaderMaterial) {
                  child.material.uniforms.time.value = elapsed
                }
              }
            })
          }
        })
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)
        let newHoveredSlice: number | null = null
        let hoveredPhilosopherNodeId: string | null = null
        if (intersects.length > 0) {
          const object = intersects[0].object
          if (object.userData.sliceIndex !== undefined) newHoveredSlice = object.userData.sliceIndex
          if (object.userData.philosopherId) {
            hoveredPhilosopherNodeId = object.userData.philosopherId
            const nameLabel = object.children.find((child) => child instanceof CSS2DObject) as CSS2DObject | undefined
            if (nameLabel && nameLabel.element) (nameLabel.element as HTMLElement).style.opacity = "1"
          }
        }
        philosopherGroupsRef.current.forEach((group) => {
          group.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              const nameLabel = child.children.find((grandchild) => grandchild instanceof CSS2DObject) as CSS2DObject | undefined
              if (nameLabel && nameLabel.element && child.userData.philosopherId !== hoveredPhilosopherNodeId) {
                ;(nameLabel.element as HTMLElement).style.opacity = "0"
              }
            }
          })
        })
        if (newHoveredSlice !== hoveredSlice) setHoveredSlice(newHoveredSlice)
      }

      slicesRef.current.forEach((sliceGroup) => {
        if (sliceGroup.userData.type === "domainLabel") {
          const index = sliceGroup.userData.index
          const isSelected = index === selectedSlice
          const label = sliceGroup.children.find((child) => child instanceof CSS2DObject) as CSS2DObject | undefined
          if (label && label.element) {
            const el = label.element as HTMLElement
            el.style.transform = isSelected || index === hoveredSlice ? "scale(1.2)" : "scale(1)"
            el.style.background = isSelected || index === hoveredSlice ? "rgba(0, 0, 0, 0.9)" : "rgba(0, 0, 0, 0.7)"
            el.style.borderWidth = isSelected || index === hoveredSlice ? "2px" : "1px"
          }
        }
      })
      yearLayersRef.current.forEach((layers) => {
        layers.forEach((layer) => {
          const sliceIndex = layer.userData.index
          const isSelected = sliceIndex === selectedSlice
          layer.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
              const mat = child.material as THREE.MeshPhongMaterial
              mat.opacity = THREE.MathUtils.lerp(
                mat.opacity,
                isSelected || sliceIndex === hoveredSlice ? 0.6 : 0.3,
                0.1,
              )
              mat.emissiveIntensity = isSelected ? 0.3 : 0
              if (isSelected) mat.emissive = new Color(sliceData[sliceIndex].color)
            }
          })
        })
      })

      if (controlsRef.current) controlsRef.current.update()
      if (composerRef.current && sceneRef.current && cameraRef.current && labelRendererRef.current) {
        composerRef.current.render()
        labelRendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    if (!isPaused) {
      animate()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, speed, hoveredSlice, selectedSlice, selectedPhilosopher, visiblePhilosophers, highlightedPhilosophers, viewMode, showConnections])

  // Effect to update particle connections visibility
  useEffect(() => {
    if (!particleSystemRef.current) return
    
    // Update all connections based on showConnections state
    particleSystemRef.current.getAllConnections().forEach(connection => {
      if (showConnections) {
        particleSystemRef.current?.setConnectionActive(connection.id, true)
      } else {
        // Only show connections for selected philosopher
        const isSelected = selectedPhilosopher && 
          (connection.fromId === selectedPhilosopher.id || 
           connection.toId === selectedPhilosopher.id)
        particleSystemRef.current?.setConnectionActive(connection.id, isSelected || false)
      }
    })
  }, [showConnections, selectedPhilosopher])

  const formatYearDisplay = (year: number | string): string => {
    if (typeof year === "number") {
      return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`
    }
    return year.toString()
  }

  return (
    <>
      <LoadingScreen 
        progress={loadingProgress} 
        isLoading={isLoading}
        onComplete={() => setIsLoading(false)}
      />
      
      <div ref={mountRef} className="absolute inset-0" />
      
      <HelpModal 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={keyboardManagerRef.current?.getShortcuts()}
      />
      
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-w-2xl p-8 text-center"
            >
              <h1 className="text-5xl font-light text-white mb-4">
                The Philosophical Nexus
              </h1>
              <p className="text-xl text-white/60 mb-8">
                Journey through 2,500 years of human thought
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-3xl mb-2">🌐</div>
                  <p className="text-sm text-white/60">Explore domains of philosophy</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-sm text-white/60">Navigate through time</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔗</div>
                  <p className="text-sm text-white/60">Discover influences</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  localStorage.setItem('philosophicalNexusVisited', 'true');
                }}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                Begin Exploration
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showHint && (
        <div className="absolute bottom-24 right-4 bg-black bg-opacity-30 text-white text-sm px-3 py-1 rounded-full transition-opacity duration-1000 opacity-80 hover:opacity-100 md:bottom-20">
          Click slices or philosophers to explore • Drag to rotate
        </div>
      )}

      {/* Top controls - Help, Info, View Mode */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="bg-gray-900/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-gray-800/80 transition-colors"
        >
          <Info size={20} />
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="bg-gray-900/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-gray-800/80 transition-colors"
        >
          <HelpCircle size={20} />
        </button>

        <button
          onClick={() => {
            const newMode = viewMode === 'orb' ? 'helix' : 'orb'
            setViewMode(newMode)
            transformToView(newMode)
          }}
          className="px-4 py-2 backdrop-blur-md bg-white/10 
                     border border-white/20 rounded-full text-white text-sm font-medium
                     hover:bg-white/20 transition-all duration-300"
        >
          {viewMode === 'orb' ? 'Timeline View' : 'Orb View'}
        </button>
      </div>

      {showLegend && (
        <div className="fixed top-16 right-4 z-40 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="text-lg font-bold mb-3">Orb Legend</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-1">Domains (Slices)</h4>
              <div className="space-y-1">
                {sliceData.map((slice) => (
                  <div key={slice.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
                    <span className="text-xs">{slice.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Layers</h4>
              <p className="text-xs">
                Each layer represents a time period. Earlier philosophers (closer to center) lived earlier in history.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Nodes</h4>
              <p className="text-xs">
                Each glowing node represents a philosopher. Filter by time using the timeline below.
              </p>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
              <div className="space-y-1 text-xs">
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">H</kbd> - Toggle Helix/Orb view</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">C</kbd> - Toggle connections</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">Space</kbd> - Pause/Resume</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">L</kbd> - Toggle legend</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">Q</kbd> - Cycle quality</div>
                <div><kbd className="px-1 py-0.5 bg-gray-800 rounded">Esc</kbd> - Close panels</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified bottom control bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Status info */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <div>
                <span className="text-gray-500">Philosophers:</span> {visiblePhilosophers.length}/{allPhilosophers.length}
              </div>
              <div>
                <span className="text-gray-500">Period:</span> {formatYearDisplay(activeTimeRange[0])} - {formatYearDisplay(activeTimeRange[1])}
              </div>
            </div>
            
            {/* Right side - Controls */}
            <div className="flex items-center gap-4">
              {/* Speed control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Speed:</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-300 w-8">{speed}x</span>
              </div>
              
              {/* Play/Pause */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isPaused ? 
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg> :
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                }
              </button>
              
              {/* Quality selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Quality:</span>
                <select 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value as 'high' | 'medium' | 'low')}
                  className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {/* Connections toggle */}
              <button
                onClick={() => setShowConnections(!showConnections)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showConnections 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Connections
              </button>
            </div>
          </div>
        </div>
      </div>

      <Sidebar
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode)
          transformToView(mode)
        }}
        showConnections={showConnections}
        onShowConnectionsChange={setShowConnections}
        isPaused={isPaused}
        onPausedChange={setIsPaused}
        speed={speed}
        onSpeedChange={setSpeed}
        timeRange={activeTimeRange}
        onTimeRangeChange={setActiveTimeRange}
        minYear={earliestBirthYear}
        maxYear={latestBirthYear}
        selectedEras={selectedEras}
        onSelectedErasChange={setSelectedEras}
        selectedDomains={selectedDomains}
        onSelectedDomainsChange={setSelectedDomains}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        visiblePhilosophersCount={visiblePhilosophers.length}
        totalPhilosophersCount={allPhilosophers.length}
        onSelectPhilosopher={jumpToPhilosopher}
      />

      {selectedSlice !== null && !selectedPhilosopher && (
        <InfoPanel 
          slice={sliceData[selectedSlice]} 
          eras={eras.map(era => ({
            ...era,
            radius: getRadiusForYear((era.startYear + era.endYear) / 2)
          }))} 
          onClose={() => setSelectedSlice(null)} 
        />
      )}

      {selectedPhilosopher && selectedSlice !== null && (
        <div className="fixed top-4 left-4 z-50 bg-gray-900/95 backdrop-blur-md text-white rounded-lg shadow-2xl max-w-md w-full md:w-96">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: sliceData[selectedSlice].color }} />
                  {selectedPhilosopher.name}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedPhilosopher.era} Era • {formatYearDisplay(selectedPhilosopher.birth)}
                  {selectedPhilosopher.death && ` - ${formatYearDisplay(selectedPhilosopher.death)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedPhilosopher(null)
                  setSelectedSlice(null)
                }}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{sliceData[selectedSlice].name}</span>
                </div>
              </div>
              <p className="text-sm max-h-40 overflow-y-auto">
                {
                  selectedPhilosopher.domainSummaries[
                    sliceData[selectedSlice].name.toLowerCase() as keyof typeof selectedPhilosopher.domainSummaries
                  ]
                }
              </p>
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium mb-2">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPhilosopher.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {selectedPhilosopher.influences.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Influenced By</h3>
                  <div className="text-xs text-gray-400">
                    {selectedPhilosopher.influences.map((id, index) => {
                      const influencer = allPhilosophers.find((p) => p.id === id)
                      return (
                        <span key={id}>
                          {influencer ? influencer.name : id}
                          {index < selectedPhilosopher.influences.length - 1 ? ", " : ""}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
