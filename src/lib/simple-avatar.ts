'use client'

// Simplified avatar implementation for demo purposes
export class SimpleAvatar {
  private container: HTMLElement
  private isSpeaking: boolean = false

  constructor(container: HTMLElement) {
    this.container = container
    this.init()
  }

  private init() {
    // Create a simple 3D-looking avatar placeholder
    this.container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      ">
        <!-- Avatar Head -->
        <div style="
          width: 120px;
          height: 120px;
          background: linear-gradient(145deg, #f0c3a0 0%, #e8b88a 100%);
          border-radius: 50%;
          position: relative;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        ">
          <!-- Eyes -->
          <div style="
            position: absolute;
            top: 35px;
            left: 30px;
            width: 12px;
            height: 12px;
            background: #333;
            border-radius: 50%;
          "></div>
          <div style="
            position: absolute;
            top: 35px;
            right: 30px;
            width: 12px;
            height: 12px;
            background: #333;
            border-radius: 50%;
          "></div>
          <!-- Mouth -->
          <div id="avatar-mouth" style="
            position: absolute;
            bottom: 35px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 15px;
            background: #d4547a;
            border-radius: 0 0 30px 30px;
            transition: all 0.2s ease;
          "></div>
        </div>

        <!-- Body -->
        <div style="
          width: 100px;
          height: 80px;
          background: linear-gradient(145deg, #4a90e2 0%, #357abd 100%);
          border-radius: 15px 15px 0 0;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        "></div>

        <!-- Status Text -->
        <div id="avatar-status" style="
          position: absolute;
          bottom: 20px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        ">Ready to speak</div>
      </div>
    `
  }

  async loadAvatar(config: { url: string; body: string }) {
    // Simulate loading
    const statusEl = this.container.querySelector('#avatar-status') as HTMLElement
    if (statusEl) {
      statusEl.textContent = 'Avatar loaded'
    }
    return Promise.resolve()
  }

  async speakText(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
    if (this.isSpeaking) return

    this.isSpeaking = true
    const statusEl = this.container.querySelector('#avatar-status') as HTMLElement
    const mouthEl = this.container.querySelector('#avatar-mouth') as HTMLElement

    if (statusEl) {
      statusEl.textContent = 'Speaking...'
    }

    // Start lip sync animation
    let animationInterval: NodeJS.Timeout | null = null
    if (mouthEl) {
      animationInterval = setInterval(() => {
        const scale = Math.random() * 0.5 + 0.5 // Random scale between 0.5 and 1
        mouthEl.style.transform = `translateX(-50%) scaleY(${scale})`
      }, 200)
    }

    // Use Web Speech API
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || 0.85
    utterance.pitch = options.pitch || 0.1
    utterance.volume = options.volume || 0.8

    // Get appropriate voice
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Google') ||
      voice.name.includes('Microsoft') ||
      voice.lang.includes('en-US')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => {
      this.isSpeaking = false
      if (statusEl) {
        statusEl.textContent = 'Speech complete'
      }
      if (animationInterval) {
        clearInterval(animationInterval)
      }
      if (mouthEl) {
        mouthEl.style.transform = 'translateX(-50%) scaleY(1)'
      }
    }

    utterance.onerror = () => {
      this.isSpeaking = false
      if (statusEl) {
        statusEl.textContent = 'Speech error'
      }
      if (animationInterval) {
        clearInterval(animationInterval)
      }
      if (mouthEl) {
        mouthEl.style.transform = 'translateX(-50%) scaleY(1)'
      }
    }

    speechSynthesis.speak(utterance)
  }

  stopSpeaking() {
    if (this.isSpeaking) {
      speechSynthesis.cancel()
      this.isSpeaking = false
      const statusEl = this.container.querySelector('#avatar-status') as HTMLElement
      if (statusEl) {
        statusEl.textContent = 'Stopped'
      }
    }
  }

  setMood(mood: string) {
    console.log(`Avatar mood set to: ${mood}`)
  }

  dispose() {
    this.stopSpeaking()
  }

  get isLoaded() {
    return true
  }

  get isSpeakingStatus() {
    return this.isSpeaking
  }
}

export default SimpleAvatar