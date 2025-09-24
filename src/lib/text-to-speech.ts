// Text-to-Speech utility for healthcare summaries
export interface TTSOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  voice?: SpeechSynthesisVoice
  lang?: string // Language code, default 'en-US'
}

export interface TTSControls {
  play: () => void
  pause: () => void
  stop: () => void
  resume: () => void
  isPlaying: boolean
  isPaused: boolean
  progress: number // 0 to 1
}

export class TextToSpeechClient {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private onStateChange: (() => void) | null = null
  private _isPlaying = false
  private _isPaused = false
  private _progress = 0
  private textChunks: string[] = []
  private currentChunkIndex = 0

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis
    }
  }

  // Get available voices, filtered for healthcare-appropriate options
  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synthesis) {
      return []
    }

    return new Promise((resolve) => {
      let voices = this.synthesis!.getVoices()

      if (voices.length === 0) {
        // Voices might not be loaded yet
        this.synthesis!.onvoiceschanged = () => {
          voices = this.synthesis!.getVoices()
          resolve(this.filterHealthcareVoices(voices))
        }
      } else {
        resolve(this.filterHealthcareVoices(voices))
      }
    })
  }

  private filterHealthcareVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    // Prefer clear, professional voices for healthcare content
    const preferredVoices = voices.filter(voice =>
      voice.lang.startsWith('en') &&
      (voice.name.includes('Natural') ||
       voice.name.includes('Enhanced') ||
       voice.name.includes('Premium') ||
       voice.default)
    )

    return preferredVoices.length > 0 ? preferredVoices : voices.filter(v => v.lang.startsWith('en'))
  }

  // Split long text into manageable chunks to avoid browser limits
  private splitTextIntoChunks(text: string, maxLength: number = 200): string[] {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text]
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += sentence
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  // Preprocess healthcare text for better pronunciation
  private preprocessHealthcareText(text: string): string {
    let processed = text

    // Medical abbreviations and terms
    const medicalReplacements: Record<string, string> = {
      // Common medical abbreviations
      'mg': 'milligrams',
      'mL': 'milliliters',
      'kg': 'kilograms',
      'BP': 'blood pressure',
      'HR': 'heart rate',
      'RR': 'respiratory rate',
      'O2': 'oxygen',
      'CO2': 'carbon dioxide',
      'IV': 'intravenous',
      'IM': 'intramuscular',
      'PO': 'by mouth',
      'PRN': 'as needed',
      'BID': 'twice daily',
      'TID': 'three times daily',
      'QID': 'four times daily',
      'QD': 'once daily',
      'h/o': 'history of',
      'c/o': 'complains of',
      'w/': 'with',
      'w/o': 'without',

      // Medical conditions (common ones)
      'HTN': 'hypertension',
      'DM': 'diabetes mellitus',
      'CAD': 'coronary artery disease',
      'CHF': 'congestive heart failure',
      'COPD': 'chronic obstructive pulmonary disease',
      'UTI': 'urinary tract infection',
      'URI': 'upper respiratory infection',
      'MI': 'myocardial infarction',
      'CVA': 'cerebrovascular accident',
      'DVT': 'deep vein thrombosis',
      'PE': 'pulmonary embolism',

      // Lab values
      'WBC': 'white blood cell count',
      'RBC': 'red blood cell count',
      'Hgb': 'hemoglobin',
      'Hct': 'hematocrit',
      'BUN': 'blood urea nitrogen',
      'Cr': 'creatinine',
      'Na': 'sodium',
      'K': 'potassium',
      'Cl': 'chloride',
      'HbA1c': 'hemoglobin A1C',
      'TSH': 'thyroid stimulating hormone',
      'PSA': 'prostate specific antigen'
    }

    // Apply replacements (case-insensitive, word boundaries)
    for (const [abbrev, full] of Object.entries(medicalReplacements)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi')
      processed = processed.replace(regex, full)
    }

    // Handle numeric ranges (e.g., "120/80" -> "120 over 80")
    processed = processed.replace(/(\d+)\/(\d+)/g, '$1 over $2')

    // Handle medical dosages (e.g., "500mg" -> "500 milligrams")
    processed = processed.replace(/(\d+)(mg|ml|kg|lbs)/gi, '$1 $2')

    // Add pauses for better readability
    processed = processed.replace(/\./g, '. ')
    processed = processed.replace(/,/g, ', ')
    processed = processed.replace(/:/g, ': ')

    return processed
  }

  async speak(
    text: string,
    options: TTSOptions = {},
    onStateChange?: () => void
  ): Promise<TTSControls> {
    this.onStateChange = onStateChange || null

    // Stop any current speech
    this.stop()

    if (!this.synthesis) {
      throw new Error('Speech synthesis not available')
    }

    // Preprocess the text for healthcare context
    const processedText = this.preprocessHealthcareText(text)

    // Split into manageable chunks
    this.textChunks = this.splitTextIntoChunks(processedText)
    this.currentChunkIndex = 0

    // Set up default options optimized for healthcare content
    const ttsOptions: Required<TTSOptions> = {
      rate: options.rate ?? 0.85, // Slightly slower for medical content
      pitch: options.pitch ?? 1,
      volume: options.volume ?? 0.8,
      voice: options.voice ?? (await this.getVoices())[0],
      lang: options.lang ?? 'en-US'
    }

    const self = this
    const controls: TTSControls = {
      play: () => this.resume(),
      pause: () => this.pause(),
      stop: () => this.stop(),
      resume: () => this.resume(),
      get isPlaying() { return self._isPlaying },
      get isPaused() { return self._isPaused },
      get progress() { return self._progress }
    }

    // Start speaking the first chunk
    this.speakChunk(0, ttsOptions)

    return controls
  }

  private speakChunk(chunkIndex: number, options: Required<TTSOptions>) {
    if (chunkIndex >= this.textChunks.length) {
      this._isPlaying = false
      this._isPaused = false
      this._progress = 1
      this.onStateChange?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(this.textChunks[chunkIndex])
    utterance.rate = options.rate
    utterance.pitch = options.pitch
    utterance.volume = options.volume
    utterance.voice = options.voice
    utterance.lang = options.lang

    utterance.onstart = () => {
      this._isPlaying = true
      this._isPaused = false
      this.onStateChange?.()
    }

    utterance.onend = () => {
      this.currentChunkIndex++
      this._progress = this.currentChunkIndex / this.textChunks.length
      this.onStateChange?.()

      // Continue to next chunk
      this.speakChunk(this.currentChunkIndex, options)
    }

    utterance.onerror = (event) => {
      console.error('TTS Error:', event.error)
      this._isPlaying = false
      this._isPaused = false
      this.onStateChange?.()
    }

    this.currentUtterance = utterance
    this.synthesis!.speak(utterance)
  }

  pause() {
    if (this.synthesis && this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
      this._isPaused = true
      this._isPlaying = false
      this.onStateChange?.()
    }
  }

  resume() {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume()
      this._isPaused = false
      this._isPlaying = true
      this.onStateChange?.()
    }
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
    this._isPlaying = false
    this._isPaused = false
    this._progress = 0
    this.currentChunkIndex = 0
    this.onStateChange?.()
  }

  // Check if browser supports TTS
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  // Get suggested TTS settings for different healthcare audiences
  static getHealthcarePresets(): Record<string, TTSOptions> {
    return {
      patient: {
        rate: 0.8, // Slower for patient comprehension
        pitch: 1.1, // Slightly higher pitch for friendliness
        volume: 0.8
      },
      provider: {
        rate: 0.9, // Standard professional rate
        pitch: 1.0, // Neutral pitch
        volume: 0.8
      },
      payer: {
        rate: 0.95, // Slightly faster for data-heavy content
        pitch: 0.95, // Slightly lower pitch for authority
        volume: 0.8
      }
    }
  }
}

// Singleton instance for global use
export const ttsClient = new TextToSpeechClient()