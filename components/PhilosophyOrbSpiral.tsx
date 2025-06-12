"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer"
import { Color } from "three"
import ControlPanel from "./ControlPanel"
import PhilosopherPanel from "./PhilosopherPanel"
import { AnimatePresence } from "framer-motion"
import { allPhilosophers, domainColors, earliestBirthYear, latestBirthYear } from "@/app/data/allPhilosophers"
import type { PhilosopherData } from "@/app/types/philosopher"

// Philosophical domains
const domains = ["ethics", "aesthetics", "logic", "politics", "metaphysics"]

// Historical eras
const eras = [
  { name: "Ancient", startYear: -600, endYear: 500 },
  { name: "Medieval", startYear: 500, endYear: 1400 },
  { name: "Renaissance", startYear: 1400, endYear: 1600 },
  { name: "Early Modern", startYear: 1600, endYear: 1800 },
  { name: "Modern", startYear: 1800, endYear: 1900 },
  { name: "Contemporary", startYear: 1900, endYear: 2023 }
]

// Calculate radius based on birth year (earlier = closer to center)
const getRadiusForYear = (year: number): number => {
  const coreRadius = 2
  const maxRadius = 6
  const yearRange = latestBirthYear - earliestBirthYear
  if (yearRange === 0) return coreRadius // Avoid division by zero
  const normalizedYear = (year - earliestBirthYear) / yearRange
  return coreRadius + normalizedYear * (maxRadius - coreRadius)
}

interface SelectedPhilosopher {
  philosopher: PhilosopherData
  domain: string
}

export default function PhilosophyOrbSpiral() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [selectedPhilosophers, setSelectedPhilosophers] = useState<SelectedPhilosopher[]>([])
  const [hoveredPhilosopher, setHoveredPhilosopher] = useState<PhilosopherData | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [showConnections, setShowConnections] = useState(false)
  const [hoveredMeshPosition, setHoveredMeshPosition] = useState<{ x: number; y: number } | null>(null)

  // Control states
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [currentColor, setCurrentColor] = useState("#3a86ff")

  // Animation references
  const animationRef = useRef<number | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const labelRendererRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const domainSlicesRef = useRef<Map<string, THREE.Group>>(new Map())
  const originalPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const connectionsGroupRef = useRef<THREE.Group | null>(null)
  const philosopherPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())

  // Calculate the number of philosophers to determine layer thickness
  const totalPhilosophers = allPhilosophers.length
  const coreRadius = 2
  const outerRadius = 6
  const layerThickness = (outerRadius - coreRadius) / totalPhilosophers

  // Add a check for empty data
  const hasPhilosophers = totalPhilosophers > 0

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // CSS2D Renderer for labels
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.domElement.style.position = "absolute"
    labelRenderer.domElement.style.top = "0px"
    labelRenderer.domElement.style.pointerEvents = "none"
    mountRef.current.appendChild(labelRenderer.domElement)
    labelRendererRef.current = labelRenderer

    // Add a central core glow
    const coreGeometry = new THREE.SphereGeometry(1.5, 32, 32)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0.3,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(core)

    // Add subtle core glow
    const glowGeometry = new THREE.SphereGeometry(1.8, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0.1,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    scene.add(glow)

    const sliceAngle = (Math.PI * 2) / domains.length
    const sliceGap = 0.02 // Small gap between slices

    // Create domain slices
    domains.forEach((domain, domainIndex) => {
      const sliceGroup = new THREE.Group()
      sliceGroup.userData = { domain }
      domainSlicesRef.current.set(domain, sliceGroup)

      // Create philosopher layers
      if (hasPhilosophers) {
        allPhilosophers.forEach((philosopher, philosopherIndex) => {
          // Calculate inner and outer radius for this philosopher's layer
          const innerRadius = coreRadius + philosopherIndex * layerThickness
          const outerRadius = innerRadius + layerThickness

          // Create sphere segment for this domain slice and philosopher layer
          const sphereGeometry = new THREE.SphereGeometry(
            (innerRadius + outerRadius) / 2,
            16,
            8,
            domainIndex * sliceAngle + sliceGap,
            sliceAngle - sliceGap * 2,
            0,
            Math.PI,
          )

          // Material with philosopher-based color
          const material = new THREE.MeshPhongMaterial({
            color: new Color(domainColors[domain as keyof typeof domainColors]),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            emissive: new Color(domainColors[domain as keyof typeof domainColors]),
            emissiveIntensity: 0,
          })

          const sliceMesh = new THREE.Mesh(sphereGeometry, material)
          sliceMesh.userData = {
            domain,
            philosopherId: philosopher.id,
            philosopherName: philosopher.name,
            philosopherEra: philosopher.era,
            layer: philosopherIndex,
          }

          // Store the original position for animation
          originalPositionsRef.current.set(`${domain}-${philosopher.id}`, sliceMesh.position.clone())

          sliceGroup.add(sliceMesh)

          // Add wireframe overlay
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: new Color(domainColors[domain as keyof typeof domainColors]),
            wireframe: true,
            transparent: true,
            opacity: 0.1,
          })
          const wireframeMesh = new THREE.Mesh(sphereGeometry, wireframeMaterial)
          sliceGroup.add(wireframeMesh)
        })
      } else {
        // If no philosophers, create a placeholder sphere
        const sphereGeometry = new THREE.SphereGeometry(
          3,
          16,
          8,
          domainIndex * sliceAngle + sliceGap,
          sliceAngle - sliceGap * 2,
          0,
          Math.PI,
        )

        const material = new THREE.MeshPhongMaterial({
          color: new Color(domainColors[domain as keyof typeof domainColors]),
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })

        const sliceMesh = new THREE.Mesh(sphereGeometry, material)
        sliceMesh.userData = { domain }
        sliceGroup.add(sliceMesh)

        // Add wireframe overlay
        const wireframeMaterial = new THREE.MeshBasicMaterial({
          color: new Color(domainColors[domain as keyof typeof domainColors]),
          wireframe: true,
          transparent: true,
          opacity: 0.1,
        })
        const wireframeMesh = new THREE.Mesh(sphereGeometry, wireframeMaterial)
        sliceGroup.add(wireframeMesh)
      }

      // Create domain label
      const labelDiv = document.createElement("div")
      labelDiv.className = "domain-label"
      labelDiv.textContent = domain.charAt(0).toUpperCase() + domain.slice(1)
      labelDiv.style.cssText = `
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 4px;
        white-space: nowrap;
        user-select: none;
        transition: all 0.3s ease;
      `

      const label = new CSS2DObject(labelDiv)
      const labelAngle = domainIndex * sliceAngle + sliceAngle / 2
      const labelRadius = 6.5
      label.position.set(Math.sin(labelAngle) * labelRadius, 0, Math.cos(labelAngle) * labelRadius)
      sliceGroup.add(label)

      scene.add(sliceGroup)
    })

    // Add era shells
    const eraShells = eras.map((era) => {
      // Calculate radius for the middle of the era
      const middleYear = (era.startYear + era.endYear) / 2
      return {
        name: era.name,
        radius: getRadiusForYear(middleYear)
      }
    })

    eraShells.forEach((era, index) => {
      const shellGeometry = new THREE.SphereGeometry(era.radius, 64, 32)
      const shellMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x0033ff).lerp(new THREE.Color(0x0099ff), index / eraShells.length),
        transparent: true,
        opacity: 0.1,
        transmission: 0.9,
        roughness: 0,
        metalness: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false // Prevent z-fighting
      })
      const shell = new THREE.Mesh(shellGeometry, shellMaterial)
      shell.userData = { type: 'eraShell', era: era.name }
      scene.add(shell)
    })

    // Calculate and store philosopher positions
    const calculatePhilosopherPositions = () => {
      domainSlicesRef.current.forEach((sliceGroup, domain) => {
        sliceGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.philosopherId) {
            const philosopherId = child.userData.philosopherId
            
            // Get world position of the mesh
            const worldPosition = new THREE.Vector3()
            child.getWorldPosition(worldPosition)
            
            // Store position for this philosopher
            const existingPos = philosopherPositionsRef.current.get(philosopherId)
            if (!existingPos) {
              philosopherPositionsRef.current.set(philosopherId, worldPosition)
            } else {
              // Average positions if philosopher appears in multiple domains
              existingPos.add(worldPosition).multiplyScalar(0.5)
            }
          }
        })
      })
    }

    // Create connection lines
    const createConnectionLines = () => {
      const connections = new THREE.Group()
      connections.name = 'philosopherConnections'
      
      allPhilosophers.forEach(philosopher => {
        if (!philosopher.influences || philosopher.influences.length === 0) return
        
        philosopher.influences.forEach(influenceId => {
          const influencer = allPhilosophers.find(p => p.id === influenceId)
          if (!influencer) return
          
          // Get positions for both philosophers
          const fromPos = philosopherPositionsRef.current.get(influencer.id)
          const toPos = philosopherPositionsRef.current.get(philosopher.id)
          
          if (!fromPos || !toPos) return
          
          // Create curved connection
          const midPoint = new THREE.Vector3()
            .addVectors(fromPos, toPos)
            .multiplyScalar(0.5)
          
          // Calculate curve height based on distance
          const distance = fromPos.distanceTo(toPos)
          const curveHeight = Math.min(distance * 0.3, 2)
          midPoint.y += curveHeight
          
          // Create catmull-rom curve for smooth connection
          const curve = new THREE.CatmullRomCurve3([
            fromPos.clone(),
            midPoint,
            toPos.clone()
          ])
          
          const points = curve.getPoints(50)
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          
          const material = new THREE.LineBasicMaterial({
            color: 0x40E0D0,
            transparent: true,
            opacity: 0,  // Start invisible
            linewidth: 2
          })
          
          const line = new THREE.Line(geometry, material)
          line.userData = {
            from: influencer.id,
            to: philosopher.id,
            fromDomain: influencer.domainSummaries ? 
              Object.keys(influencer.domainSummaries).find(d => influencer.domainSummaries[d as keyof typeof influencer.domainSummaries]) 
              : 'metaphysics',
            toDomain: philosopher.domainSummaries ? 
              Object.keys(philosopher.domainSummaries).find(d => philosopher.domainSummaries[d as keyof typeof philosopher.domainSummaries]) 
              : 'metaphysics'
          }
          
          connections.add(line)
        })
      })
      
      scene.add(connections)
      connectionsGroupRef.current = connections
      return connections
    }

    // Calculate positions and create connections after all meshes are created
    setTimeout(() => {
      calculatePhilosopherPositions()
      createConnectionLines()
    }, 100)

    // Add lights
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
    controls.minDistance = 8
    controls.maxDistance = 20
    controlsRef.current = controls

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      
      // Update hover position for tooltip
      if (hoveredPhilosopher) {
        setHoveredMeshPosition({ x: event.clientX, y: event.clientY })
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !sceneRef.current) return

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const object = intersects[0].object
        // Skip era shells
        if (object.userData.type === 'eraShell') {
          return
        }
        
        if (object.userData.domain && object.userData.philosopherId) {
          const domain = object.userData.domain
          const philosopherId = object.userData.philosopherId

          // Find the philosopher data
          const philosopher = allPhilosophers.find((p) => p.id === philosopherId)
          if (philosopher) {
            const newSelection = { philosopher, domain }
            
            // Check if this philosopher is already selected
            const existingIndex = selectedPhilosophers.findIndex(
              sp => sp.philosopher.id === philosopherId && sp.domain === domain
            )
            
            if (existingIndex >= 0) {
              // Remove if already selected
              const newSelections = [...selectedPhilosophers]
              newSelections.splice(existingIndex, 1)
              setSelectedPhilosophers(newSelections)
              
              // Animate back
              animateSlice(domain, philosopherId, false)
            } else {
              // Add to selection (max 3)
              if (selectedPhilosophers.length < 3) {
                setSelectedPhilosophers([...selectedPhilosophers, newSelection])
                
                // Animate outward
                animateSlice(domain, philosopherId, true)
                
                // Set domain if first selection
                if (selectedPhilosophers.length === 0) {
                  setSelectedDomain(domain)
                  animateDomainWedge(domain, true)
                }
              }
            }
          }
        }
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && labelRendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
        labelRendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener("resize", handleResize)

    const hintTimer = setTimeout(() => {
      setShowHint(false)
    }, 3000)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && rendererRef.current && labelRendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        mountRef.current.removeChild(labelRendererRef.current.domElement)
      }
      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
      clearTimeout(hintTimer)
    }
  }, [])

  // Function to animate a slice outward or back
  const animateSlice = (domain: string, philosopherId: string, outward: boolean) => {
    const sliceGroup = domainSlicesRef.current.get(domain)
    if (!sliceGroup) return

    // Find all meshes for this philosopher in this domain
    sliceGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.userData.philosopherId === philosopherId) {
        const key = `${domain}-${philosopherId}`
        const originalPosition = originalPositionsRef.current.get(key)

        if (originalPosition) {
          // Calculate the direction vector from center to the mesh
          const direction = new THREE.Vector3()
          direction.subVectors(child.position, new THREE.Vector3(0, 0, 0)).normalize()

          // Set the target position
          const targetPosition = new THREE.Vector3()
          if (outward) {
            // Move outward by 0.2 units
            targetPosition.copy(originalPosition).add(direction.multiplyScalar(0.2))
            child.position.copy(targetPosition)
          } else {
            // Move back to original position
            child.position.copy(originalPosition)
          }
        }
      }
    })
  }

  // Function to animate entire domain wedge
  const animateDomainWedge = (domain: string, expand: boolean) => {
    const sliceGroup = domainSlicesRef.current.get(domain)
    if (!sliceGroup) return

    // Calculate radial direction for this domain
    const domainIndex = domains.indexOf(domain)
    const angle = (domainIndex * 2 * Math.PI / domains.length) + Math.PI / domains.length
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))

    // Animate all children in the domain group
    sliceGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const targetOffset = expand ? direction.clone().multiplyScalar(0.5) : new THREE.Vector3(0, 0, 0)
        
        // Store original position if not already stored
        if (!child.userData.originalPosition) {
          child.userData.originalPosition = child.position.clone()
        }
        
        const startPos = child.userData.originalPosition.clone()
        child.userData.targetPosition = startPos.clone().add(targetOffset)
        child.userData.animationProgress = 0
        child.userData.isAnimating = true
      }
    })
  }

  // Animation loop
  useEffect(() => {
    if (
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !controlsRef.current ||
      !labelRendererRef.current
    )
      return

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)

      // Check for hover
      if (cameraRef.current && sceneRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)

        let newHoveredPhilosopher: PhilosopherData | null = null
        let newHoveredDomain: string | null = null

        if (intersects.length > 0) {
          const object = intersects[0].object
          // Skip era shells for hover
          if (object.userData.type !== 'eraShell') {
            if (object.userData.domain && object.userData.philosopherId) {
              const domain = object.userData.domain
              const philosopherId = object.userData.philosopherId

              // Find the philosopher data
              const philosopher = allPhilosophers.find((p) => p.id === philosopherId)
              if (philosopher) {
                newHoveredPhilosopher = philosopher
                newHoveredDomain = domain
              }
            }
          }
        }

        if (newHoveredPhilosopher?.id !== hoveredPhilosopher?.id) {
          setHoveredPhilosopher(newHoveredPhilosopher)
        }

        if (newHoveredDomain !== hoveredDomain) {
          setHoveredDomain(newHoveredDomain)
        }
      }

      if (!isPaused) {
        // Rotate domain slices
        domainSlicesRef.current.forEach((sliceGroup, domain) => {
          sliceGroup.rotation.y += 0.001 * speed + domains.indexOf(domain) * 0.0001 * speed
        })
      }

      // Animate domain wedges
      domainSlicesRef.current.forEach((sliceGroup) => {
        sliceGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData.isAnimating) {
            const progress = child.userData.animationProgress || 0
            const targetPos = child.userData.targetPosition
            const originalPos = child.userData.originalPosition
            
            if (targetPos && originalPos && progress < 1) {
              // Smooth easing function
              const easedProgress = 1 - Math.pow(1 - progress, 3)
              child.position.lerpVectors(originalPos, targetPos, easedProgress)
              
              // Update progress
              child.userData.animationProgress = Math.min(progress + 0.05, 1)
              
              // Stop animating when complete
              if (child.userData.animationProgress >= 1) {
                child.userData.isAnimating = false
              }
            }
          }
        })
      })

      // Update hover effects for domains
      domainSlicesRef.current.forEach((sliceGroup, domain) => {
        const isHovered = domain === hoveredDomain
        const isSelected = domain === selectedDomain

        sliceGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
            // Get the philosopher ID from the mesh
            const philosopherId = child.userData.philosopherId

            // Check if this philosopher is hovered or selected
            const isPhilosopherHovered = hoveredPhilosopher?.id === philosopherId
            const isPhilosopherSelected = selectedPhilosophers.some(sp => sp.philosopher.id === philosopherId && sp.domain === domain)

            // Enhanced opacity calculation
            let targetOpacity = 0.3
            if (isSelected) {
              // Domain is selected
              targetOpacity = isPhilosopherHovered || isPhilosopherSelected ? 0.9 : 0.7
            } else if (selectedDomain) {
              // Another domain is selected, make this one more transparent
              targetOpacity = 0.15
            } else if (isHovered) {
              // Domain is hovered
              targetOpacity = isPhilosopherHovered || isPhilosopherSelected ? 0.8 : 0.5
            } else if (isPhilosopherHovered || isPhilosopherSelected) {
              // Philosopher is highlighted but domain isn't
              targetOpacity = 0.5
            }

            child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1)

            // Enhanced emissive glow for selected domains
            if (isSelected || (isHovered && isPhilosopherHovered)) {
              child.material.emissive = new Color(domainColors[domain as keyof typeof domainColors])
              child.material.emissiveIntensity = isSelected ? 0.5 : 0.3
              
              // Scale up philosophers in selected domain
              if (isSelected && philosopherId) {
                const targetScale = isPhilosopherHovered || isPhilosopherSelected ? 1.5 : 1.2
                child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, targetScale, 0.1))
              } else {
                child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, 1.0, 0.1))
              }
            } else {
              child.material.emissiveIntensity = 0
              child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, 1.0, 0.1))
            }
          }

          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
            // Update wireframe opacity
            const targetOpacity = isSelected ? 0.3 : isHovered ? 0.2 : 0.1
            child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1)
          }
        })

        // Update label styles
        const label = sliceGroup.children.find((child) => child instanceof CSS2DObject) as CSS2DObject | undefined
        if (label) {
          const labelElement = label.element as HTMLDivElement
          if (isHovered || isSelected) {
            labelElement.style.transform = "scale(1.2)"
            labelElement.style.background = "rgba(0, 0, 0, 0.9)"
          } else {
            labelElement.style.transform = "scale(1)"
            labelElement.style.background = "rgba(0, 0, 0, 0.7)"
          }
        }
      })

      // Update connection visibility
      if (connectionsGroupRef.current && connectionsGroupRef.current.children) {
        connectionsGroupRef.current.children.forEach(child => {
          if (child instanceof THREE.Line && child.material instanceof THREE.LineBasicMaterial) {
            let targetOpacity = 0
            
            // Show connections when toggle is on
            if (showConnections) {
              targetOpacity = 0.2
            }
            
            // Show connections for hovered philosopher
            if (hoveredPhilosopher && 
                (child.userData.from === hoveredPhilosopher.id || 
                 child.userData.to === hoveredPhilosopher.id)) {
              targetOpacity = 0.6
            }
            
            // Show connections for selected philosopher
            if (selectedPhilosophers.some(sp => sp.philosopher.id === child.userData.from && sp.domain === child.userData.fromDomain) ||
                selectedPhilosophers.some(sp => sp.philosopher.id === child.userData.to && sp.domain === child.userData.toDomain)) {
              targetOpacity = 0.8
              
              // Make the line glow
              child.material.color = new THREE.Color(
                child.userData.from === selectedPhilosophers[0].philosopher.id ? 0xFF6B6B : 0x4ECDC4
              )
            } else {
              // Reset color
              child.material.color = new THREE.Color(0x40E0D0)
            }
            
            // Show all connections in selected domain
            if (selectedDomain && showConnections &&
                (child.userData.fromDomain === selectedDomain || 
                 child.userData.toDomain === selectedDomain)) {
              targetOpacity = Math.max(targetOpacity, 0.3)
            }
            
            // Smooth opacity transition
            child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1)
            child.material.needsUpdate = true
          }
        })
      }

      // Always update controls for interactivity
      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        labelRendererRef.current?.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, speed, hoveredPhilosopher, selectedPhilosophers, hoveredDomain, selectedDomain, showConnections])

  // Predefined colors for the control panel
  const predefinedColors = Object.values(domainColors)

  return (
    <>
      {!hasPhilosophers && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">No Philosopher Data</h2>
            <p className="mb-4">
              The visualization requires philosopher data to display properly. Currently using sample data with{" "}
              {totalPhilosophers} philosophers.
            </p>
          </div>
        </div>
      )}

      {/* Domain selection buttons */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
        {domains.map((domain) => (
          <button
            key={domain}
            onClick={() => {
              const newSelected = selectedDomain === domain ? null : domain
              
              // Animate out previous domain
              if (selectedDomain && selectedDomain !== domain) {
                animateDomainWedge(selectedDomain, false)
              }
              
              // Animate new domain
              if (newSelected) {
                animateDomainWedge(newSelected, true)
              } else {
                animateDomainWedge(domain, false)
              }
              
              setSelectedDomain(newSelected)
            }}
            className={`px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300 
              ${selectedDomain === domain 
                ? 'bg-white/30 scale-110' 
                : 'bg-black/20 hover:bg-white/10'}`}
            style={{
              borderColor: domainColors[domain as keyof typeof domainColors], 
              borderWidth: 2
            }}
          >
            <span className="text-white font-medium capitalize">{domain}</span>
          </button>
        ))}
      </div>

      <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0">
        {showHint && (
          <div className="absolute bottom-20 right-4 bg-black bg-opacity-30 text-white text-sm px-3 py-1 rounded-full transition-opacity duration-1000 opacity-80 hover:opacity-100 md:bottom-16">
            Click on a section to explore philosophers • Drag to rotate
          </div>
        )}
      </div>

      <ControlPanel
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        speed={speed}
        setSpeed={setSpeed}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        predefinedColors={predefinedColors}
        showConnections={showConnections}
        setShowConnections={setShowConnections}
      />

      {/* Hover tooltip */}
      {hoveredPhilosopher && hoveredMeshPosition && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${hoveredMeshPosition.x}px`,
            top: `${hoveredMeshPosition.y - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: domainColors[hoveredDomain as keyof typeof domainColors] }}
              />
              <span className="text-sm font-medium">{hoveredPhilosopher.name}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {hoveredPhilosopher.era} • Click to explore
            </div>
          </div>
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"
            style={{ bottom: '-4px' }}
          />
        </div>
      )}

      {/* Philosopher panels */}
      <AnimatePresence>
        {selectedPhilosophers.map((selection, index) => (
          <PhilosopherPanel
            key={`${selection.philosopher.id}-${selection.domain}`}
            philosopher={selection.philosopher}
            domain={selection.domain}
            index={index}
            totalPanels={selectedPhilosophers.length}
            onClose={() => {
              const newSelections = [...selectedPhilosophers]
              newSelections.splice(index, 1)
              setSelectedPhilosophers(newSelections)
              
              // Animate slice back
              animateSlice(selection.domain, selection.philosopher.id, false)
              
              // Reset domain if no selections left
              if (newSelections.length === 0) {
                setSelectedDomain(null)
                animateDomainWedge(selection.domain, false)
              }
            }}
            onNavigate={(direction) => {
              const newIndex = direction === 'next' ? index + 1 : index - 1
              if (newIndex >= 0 && newIndex < selectedPhilosophers.length) {
                const newSelections = [...selectedPhilosophers]
                const temp = newSelections[index]
                newSelections[index] = newSelections[newIndex]
                newSelections[newIndex] = temp
                setSelectedPhilosophers(newSelections)
              }
            }}
          />
        ))}
      </AnimatePresence>
    </>
  )
}
