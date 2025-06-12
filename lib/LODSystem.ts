import * as THREE from 'three'

export interface LODLevel {
  distance: number
  geometryDetail: number
  showLabel: boolean
  showEffects: boolean
}

export class PhilosopherLODSystem {
  private lodLevels: LODLevel[] = [
    { distance: 0, geometryDetail: 16, showLabel: true, showEffects: true },    // High detail
    { distance: 15, geometryDetail: 8, showLabel: true, showEffects: false },   // Medium detail
    { distance: 30, geometryDetail: 4, showLabel: false, showEffects: false },  // Low detail
    { distance: 50, geometryDetail: 2, showLabel: false, showEffects: false }   // Minimal detail
  ]
  
  private geometryCache: Map<number, THREE.SphereGeometry> = new Map()
  private camera: THREE.Camera | null = null
  
  constructor() {
    // Pre-create geometries for each LOD level
    this.lodLevels.forEach(level => {
      const geometry = new THREE.SphereGeometry(0.08, level.geometryDetail, level.geometryDetail)
      this.geometryCache.set(level.geometryDetail, geometry)
    })
  }
  
  setCamera(camera: THREE.Camera) {
    this.camera = camera
  }
  
  getLODLevel(object: THREE.Object3D): LODLevel {
    if (!this.camera) return this.lodLevels[0]
    
    const distance = object.position.distanceTo(this.camera.position)
    
    // Find appropriate LOD level based on distance
    for (let i = this.lodLevels.length - 1; i >= 0; i--) {
      if (distance >= this.lodLevels[i].distance) {
        return this.lodLevels[i]
      }
    }
    
    return this.lodLevels[0]
  }
  
  updatePhilosopherLOD(mesh: THREE.Mesh, lodLevel: LODLevel) {
    const newGeometry = this.geometryCache.get(lodLevel.geometryDetail)
    if (newGeometry && mesh.geometry !== newGeometry) {
      mesh.geometry = newGeometry
    }
    
    // Update label visibility
    const label = mesh.children.find(child => child.userData.isLabel)
    if (label) {
      label.visible = lodLevel.showLabel
    }
    
    // Update shader material effects
    if (mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.uniforms.glowIntensity.value = lodLevel.showEffects ? 0.3 : 0.1
    }
  }
  
  dispose() {
    this.geometryCache.forEach(geometry => geometry.dispose())
    this.geometryCache.clear()
  }
}

// Enhanced frustum culling with spatial indexing
export class FrustumCullingSystem {
  private octree: THREE.Box3[] = []
  private objectBounds: Map<string, THREE.Box3> = new Map()
  private frustum: THREE.Frustum = new THREE.Frustum()
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4()
  
  updateObjectBounds(id: string, object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object)
    this.objectBounds.set(id, box)
  }
  
  updateFrustum(camera: THREE.Camera) {
    this.cameraMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)
  }
  
  isObjectVisible(id: string): boolean {
    const bounds = this.objectBounds.get(id)
    if (!bounds) return true
    
    return this.frustum.intersectsBox(bounds)
  }
  
  // Batch visibility check for performance
  checkVisibilityBatch(ids: string[]): Map<string, boolean> {
    const results = new Map<string, boolean>()
    
    ids.forEach(id => {
      results.set(id, this.isObjectVisible(id))
    })
    
    return results
  }
} 