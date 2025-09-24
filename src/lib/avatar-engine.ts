// 3D Avatar Engine for Healthcare Applications
import * as THREE from 'three'

export interface AvatarConfig {
  gender: 'male' | 'female'
  mood: 'neutral' | 'calm' | 'professional' | 'caring'
  voice: SpeechSynthesisVoice
  language: string
}

export interface VisemeData {
  time: number
  viseme: string
  duration: number
}

export interface AvatarControls {
  speak: (text: string) => Promise<AvatarControls>
  stop: () => void
  setMood: (mood: string) => void
  setExpression: (expression: string) => void
  isPlaying: boolean
  progress: number
}

export class HealthcareAvatarEngine {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private avatar: THREE.Group | null = null
  private mixer: THREE.AnimationMixer | null = null
  private clock: THREE.Clock
  private isInitialized = false
  private currentSpeech: SpeechSynthesisUtterance | null = null
  private animationFrame: number | null = null

  // Avatar facial components
  private head: THREE.Mesh | null = null
  private eyes: { left: THREE.Mesh | null; right: THREE.Mesh | null } = { left: null, right: null }
  private mouth: THREE.Group | null = null
  private eyebrows: { left: THREE.Mesh | null; right: THREE.Mesh | null } = { left: null, right: null }

  // Animation states
  private _isPlaying = false
  private _progress = 0
  private blinkTimer = 0
  private lookTimer = 0
  private breatheTimer = 0

  // Medical-specific configurations
  private medicalMoods = {
    neutral: { eyeOpenness: 0.8, mouthRelax: 0.1, headTilt: 0 },
    calm: { eyeOpenness: 0.7, mouthRelax: 0.15, headTilt: -0.05 },
    professional: { eyeOpenness: 0.9, mouthRelax: 0.05, headTilt: 0.02 },
    caring: { eyeOpenness: 0.75, mouthRelax: 0.2, headTilt: -0.02 }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock()
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    })

    this.setupScene()
  }

  private setupScene() {
    // Scene setup
    this.scene.background = new THREE.Color(0xf0f8ff) // Light blue medical background

    // Lighting setup for professional medical appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 10, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    // Key light for face
    const keyLight = new THREE.SpotLight(0xffffff, 0.5)
    keyLight.position.set(-2, 2, 3)
    keyLight.target.position.set(0, 0, 0)
    this.scene.add(keyLight)
    this.scene.add(keyLight.target)

    // Camera positioning for professional medical consultation view
    this.camera.position.set(0, 1.6, 3)
    this.camera.lookAt(0, 1.5, 0)

    this.renderer.setSize(512, 512)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  async initializeAvatar(config: AvatarConfig) {
    try {
      await this.createMedicalAvatar(config)
      this.startAnimation()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize avatar:', error)
      throw error
    }
  }

  private async createMedicalAvatar(config: AvatarConfig) {
    this.avatar = new THREE.Group()

    // Create head
    const headGeometry = new THREE.SphereGeometry(1, 32, 32)
    const headMaterial = new THREE.MeshLambertMaterial({
      color: 0xfdbcb4, // Skin tone
      transparent: true,
      opacity: 0.95
    })
    this.head = new THREE.Mesh(headGeometry, headMaterial)
    this.head.position.y = 1.5
    this.head.castShadow = true
    this.avatar.add(this.head)

    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x87ceeb })

    this.eyes.left = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.eyes.left.position.set(-0.3, 0.2, 0.7)
    this.head.add(this.eyes.left)

    this.eyes.right = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.eyes.right.position.set(0.3, 0.2, 0.7)
    this.head.add(this.eyes.right)

    // Create pupils
    const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16)
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3e50 })

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    leftPupil.position.set(0, 0, 0.1)
    this.eyes.left!.add(leftPupil)

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    rightPupil.position.set(0, 0, 0.1)
    this.eyes.right!.add(rightPupil)

    // Create mouth group for lip sync
    this.mouth = new THREE.Group()
    const mouthGeometry = new THREE.RingGeometry(0.1, 0.25, 16)
    const mouthMaterial = new THREE.MeshBasicMaterial({
      color: 0xe74c3c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    })
    const mouthMesh = new THREE.Mesh(mouthGeometry, mouthMaterial)
    mouthMesh.position.set(0, -0.3, 0.7)
    this.mouth.add(mouthMesh)
    this.head.add(this.mouth)

    // Create eyebrows for expressions
    const eyebrowGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.1)
    const eyebrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 })

    this.eyebrows.left = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial)
    this.eyebrows.left.position.set(-0.3, 0.5, 0.6)
    this.head.add(this.eyebrows.left)

    this.eyebrows.right = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial)
    this.eyebrows.right.position.set(0.3, 0.5, 0.6)
    this.head.add(this.eyebrows.right)

    // Create simple body for professional appearance
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2, 8)
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: config.gender === 'female' ? 0x4a90e2 : 0x2c3e50 // Professional colors
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0
    body.castShadow = true
    this.avatar.add(body)

    // Add name tag for medical professional appearance
    const nameTagGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.05)
    const nameTagMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const nameTag = new THREE.Mesh(nameTagGeometry, nameTagMaterial)
    nameTag.position.set(0.5, 0.8, 0.8)
    this.avatar.add(nameTag)

    this.scene.add(this.avatar)
    this.setMood('professional')
  }

  private startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    const animate = () => {
      this.animationFrame = requestAnimationFrame(animate)
      const delta = this.clock.getDelta()

      if (this.avatar && this.head) {
        // Natural breathing animation
        this.breatheTimer += delta
        const breatheIntensity = Math.sin(this.breatheTimer * 2) * 0.02
        this.avatar.scale.y = 1 + breatheIntensity

        // Natural head movement
        this.lookTimer += delta * 0.3
        this.head.rotation.x = Math.sin(this.lookTimer) * 0.05
        this.head.rotation.y = Math.cos(this.lookTimer * 0.7) * 0.03

        // Blinking animation
        this.blinkTimer += delta
        if (this.eyes.left && this.eyes.right) {
          const shouldBlink = Math.sin(this.blinkTimer * 3) > 0.95
          const blinkScale = shouldBlink ? 0.1 : 1
          this.eyes.left.scale.y = blinkScale
          this.eyes.right.scale.y = blinkScale
        }
      }

      if (this.mixer) {
        this.mixer.update(delta)
      }

      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  setMood(mood: keyof typeof this.medicalMoods) {
    if (!this.head || !this.eyes.left || !this.eyes.right) return

    const moodConfig = this.medicalMoods[mood]

    // Adjust eye openness
    this.eyes.left.scale.y = moodConfig.eyeOpenness
    this.eyes.right.scale.y = moodConfig.eyeOpenness

    // Adjust head tilt
    this.head.rotation.z = moodConfig.headTilt

    // Adjust mouth relaxation
    if (this.mouth) {
      this.mouth.scale.x = 1 + moodConfig.mouthRelax
    }
  }

  async speak(text: string, voice: SpeechSynthesisVoice): Promise<AvatarControls> {
    if (!this.isInitialized) {
      throw new Error('Avatar not initialized')
    }

    // Stop any current speech
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8

    // Estimate speech duration for progress tracking
    const estimatedDuration = text.length / 10 // Rough estimate

    utterance.onstart = () => {
      this._isPlaying = true
      this.setMood('caring')
    }

    utterance.onend = () => {
      this._isPlaying = false
      this._progress = 1
      this.setMood('professional')
    }

    utterance.onerror = () => {
      this._isPlaying = false
      this.setMood('professional')
    }

    // Simple lip sync animation
    utterance.onboundary = (event) => {
      if (this.mouth && event.name === 'word') {
        this._progress = event.charIndex / text.length
        this.animateMouth()
      }
    }

    this.currentSpeech = utterance
    window.speechSynthesis.speak(utterance)

    const self = this
    const controls: AvatarControls = {
      speak: (newText: string) => this.speak(newText, voice),
      stop: () => this.stop(),
      setMood: (newMood: string) => this.setMood(newMood as keyof typeof this.medicalMoods),
      setExpression: (expression: string) => this.setExpression(expression),
      get isPlaying() { return self._isPlaying },
      get progress() { return self._progress }
    }

    return controls
  }

  private animateMouth() {
    if (!this.mouth) return

    // Simple mouth animation for speech
    const intensity = this._isPlaying ? 0.3 + Math.random() * 0.4 : 0.1
    this.mouth.scale.set(1 + intensity, 1 + intensity * 0.5, 1)

    // Reset after short delay
    setTimeout(() => {
      if (this.mouth) {
        this.mouth.scale.set(1, 1, 1)
      }
    }, 100)
  }

  setExpression(expression: string) {
    if (!this.eyebrows.left || !this.eyebrows.right) return

    switch (expression) {
      case 'concerned':
        this.eyebrows.left.rotation.z = 0.2
        this.eyebrows.right.rotation.z = -0.2
        break
      case 'reassuring':
        this.eyebrows.left.rotation.z = -0.1
        this.eyebrows.right.rotation.z = 0.1
        if (this.mouth) {
          this.mouth.position.z = 0.8 // Slight smile
        }
        break
      case 'attentive':
        this.eyebrows.left.position.y = 0.55
        this.eyebrows.right.position.y = 0.55
        break
      default:
        this.eyebrows.left.rotation.z = 0
        this.eyebrows.right.rotation.z = 0
        this.eyebrows.left.position.y = 0.5
        this.eyebrows.right.position.y = 0.5
        if (this.mouth) {
          this.mouth.position.z = 0.7
        }
    }
  }

  stop() {
    if (this.currentSpeech) {
      window.speechSynthesis.cancel()
      this.currentSpeech = null
    }
    this._isPlaying = false
    this._progress = 0
    this.setMood('professional')
    if (this.mouth) {
      this.mouth.scale.set(1, 1, 1)
    }
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    this.stop()
    this.scene.clear()
    this.renderer.dispose()
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }
}