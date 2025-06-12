export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled: boolean = true
  private isInputFocused: boolean = false
  
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    // Track input focus to disable shortcuts when typing
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement
      this.isInputFocused = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true'
    })
    
    document.addEventListener('focusout', () => {
      this.isInputFocused = false
    })
    
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
  }
  
  private handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled || this.isInputFocused) return
    
    const shortcutKey = this.getShortcutKey(event)
    const shortcut = this.shortcuts.get(shortcutKey)
    
    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }
  
  private getShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }
  
  register(shortcut: KeyboardShortcut) {
    const key = this.buildShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }
  
  private buildShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }
  
  unregister(key: string) {
    this.shortcuts.delete(key)
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
  
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }
  
  // Format shortcut for display
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.shift) parts.push('Shift')
    if (shortcut.alt) parts.push('Alt')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }
  
  dispose() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
}

// Default shortcuts for the globe visualization
export const createDefaultShortcuts = (callbacks: {
  togglePause?: () => void
  toggleHelp?: () => void
  toggleLegend?: () => void
  toggleConnections?: () => void
  resetCamera?: () => void
  toggleViewMode?: () => void
  increaseSpeed?: () => void
  decreaseSpeed?: () => void
  toggleFullscreen?: () => void
  search?: () => void
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = []
  
  if (callbacks.togglePause) {
    shortcuts.push({
      key: ' ',
      description: 'Play/Pause animation',
      action: callbacks.togglePause
    })
  }
  
  if (callbacks.toggleHelp) {
    shortcuts.push({
      key: 'h',
      description: 'Toggle help',
      action: callbacks.toggleHelp
    })
    shortcuts.push({
      key: '?',
      description: 'Toggle help',
      action: callbacks.toggleHelp
    })
  }
  
  if (callbacks.toggleLegend) {
    shortcuts.push({
      key: 'l',
      description: 'Toggle legend',
      action: callbacks.toggleLegend
    })
  }
  
  if (callbacks.toggleConnections) {
    shortcuts.push({
      key: 'c',
      description: 'Toggle connections',
      action: callbacks.toggleConnections
    })
  }
  
  if (callbacks.resetCamera) {
    shortcuts.push({
      key: 'r',
      description: 'Reset camera view',
      action: callbacks.resetCamera
    })
  }
  
  if (callbacks.toggleViewMode) {
    shortcuts.push({
      key: 'v',
      description: 'Toggle view mode (Orb/Helix)',
      action: callbacks.toggleViewMode
    })
  }
  
  if (callbacks.increaseSpeed) {
    shortcuts.push({
      key: '+',
      description: 'Increase animation speed',
      action: callbacks.increaseSpeed
    })
    shortcuts.push({
      key: '=',
      description: 'Increase animation speed',
      action: callbacks.increaseSpeed
    })
  }
  
  if (callbacks.decreaseSpeed) {
    shortcuts.push({
      key: '-',
      description: 'Decrease animation speed',
      action: callbacks.decreaseSpeed
    })
  }
  
  if (callbacks.toggleFullscreen) {
    shortcuts.push({
      key: 'f',
      description: 'Toggle fullscreen',
      action: callbacks.toggleFullscreen
    })
  }
  
  if (callbacks.search) {
    shortcuts.push({
      key: '/',
      description: 'Focus search',
      action: callbacks.search
    })
    shortcuts.push({
      key: 's',
      ctrl: true,
      description: 'Focus search',
      action: callbacks.search
    })
  }
  
  return shortcuts
} 