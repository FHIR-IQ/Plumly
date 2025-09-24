// Text-to-Speech utility for healthcare summaries
export interface TTSOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  voice?: SpeechSynthesisVoice
  lang?: string // Language code, default 'en-US'
  gender?: 'male' | 'female' | 'neutral' // Voice gender preference
}

export interface VoiceInfo {
  voice: SpeechSynthesisVoice
  gender: 'male' | 'female' | 'neutral'
  quality: 'natural' | 'enhanced' | 'standard'
  displayName: string
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

  // Get available voices with enhanced metadata
  async getVoicesWithInfo(): Promise<VoiceInfo[]> {
    if (!this.synthesis) {
      return []
    }

    return new Promise((resolve) => {
      let voices = this.synthesis!.getVoices()

      if (voices.length === 0) {
        // Voices might not be loaded yet
        this.synthesis!.onvoiceschanged = () => {
          voices = this.synthesis!.getVoices()
          resolve(this.categorizeVoices(voices))
        }
      } else {
        resolve(this.categorizeVoices(voices))
      }
    })
  }

  // Get available voices, filtered for healthcare-appropriate options
  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    const voicesWithInfo = await this.getVoicesWithInfo()
    return voicesWithInfo.map(v => v.voice)
  }

  private categorizeVoices(voices: SpeechSynthesisVoice[]): VoiceInfo[] {
    return voices
      .filter(voice => voice.lang.startsWith('en'))
      .map(voice => {
        // Determine gender based on voice name patterns
        let gender: 'male' | 'female' | 'neutral' = 'neutral'
        const nameLower = voice.name.toLowerCase()

        // Common patterns for female voices
        const femalePatterns = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria',
                               'karen', 'moira', 'fiona', 'tessa', 'sara', 'susan', 'catherine',
                               'allison', 'ava', 'nora', 'emily', 'joanna', 'ivy', 'kendra',
                               'aria', 'salli', 'kimberly', 'jennifer', 'michelle']

        // Common patterns for male voices
        const malePatterns = ['male', 'man', 'boy', 'david', 'mark', 'james', 'daniel',
                             'thomas', 'alex', 'fred', 'dennis', 'brad', 'tom', 'will',
                             'matthew', 'joey', 'justin', 'brian', 'eric', 'russell',
                             'guy', 'nathan', 'stephen', 'oliver', 'aaron', 'michael']

        if (femalePatterns.some(pattern => nameLower.includes(pattern))) {
          gender = 'female'
        } else if (malePatterns.some(pattern => nameLower.includes(pattern))) {
          gender = 'male'
        }

        // Determine quality based on voice name
        let quality: 'natural' | 'enhanced' | 'standard' = 'standard'
        if (voice.name.includes('Natural') || voice.name.includes('Neural')) {
          quality = 'natural'
        } else if (voice.name.includes('Enhanced') || voice.name.includes('Premium') ||
                   voice.name.includes('Plus') || voice.name.includes('HD')) {
          quality = 'enhanced'
        }

        // Create a friendly display name
        let displayName = voice.name
        // Clean up common prefixes/suffixes
        displayName = displayName.replace(/^Microsoft\s+/i, '')
        displayName = displayName.replace(/^Google\s+/i, '')
        displayName = displayName.replace(/\s+\(.*\)$/i, '')
        displayName = displayName.replace(/\s+Online$/i, '')
        displayName = displayName.replace(/\s+\(Natural\)$/i, ' AI')

        // Add quality indicator
        if (quality === 'natural') {
          displayName += ' (Natural AI)'
        } else if (quality === 'enhanced') {
          displayName += ' (Enhanced)'
        }

        return {
          voice,
          gender,
          quality,
          displayName
        }
      })
      .sort((a, b) => {
        // Sort by quality first (natural > enhanced > standard)
        const qualityOrder = { natural: 0, enhanced: 1, standard: 2 }
        const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality]
        if (qualityDiff !== 0) return qualityDiff

        // Then by name
        return a.displayName.localeCompare(b.displayName)
      })
  }

  // Get best voice matching preferences
  async getBestVoice(gender?: 'male' | 'female' | 'neutral'): Promise<SpeechSynthesisVoice | null> {
    const voicesWithInfo = await this.getVoicesWithInfo()

    if (voicesWithInfo.length === 0) return null

    // Filter by gender if specified
    let filtered = voicesWithInfo
    if (gender && gender !== 'neutral') {
      const genderFiltered = voicesWithInfo.filter(v => v.gender === gender)
      if (genderFiltered.length > 0) {
        filtered = genderFiltered
      }
    }

    // Prefer natural voices
    const natural = filtered.filter(v => v.quality === 'natural')
    if (natural.length > 0) return natural[0].voice

    // Then enhanced
    const enhanced = filtered.filter(v => v.quality === 'enhanced')
    if (enhanced.length > 0) return enhanced[0].voice

    // Finally standard
    return filtered[0]?.voice || null
  }

  // Split long text into manageable chunks with natural pauses
  private splitTextIntoChunks(text: string, maxLength: number = 300): string[] {
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

    // Add natural pauses and emphasis
    processed = processed.replace(/\./g, '. ')
    processed = processed.replace(/,/g, ', ')
    processed = processed.replace(/:/g, ': ')
    processed = processed.replace(/;/g, '; ')

    // Add emphasis to important medical terms
    processed = processed.replace(/(CRITICAL|URGENT|WARNING|CAUTION|IMPORTANT)/gi, (match) => {
      return `... ${match} ...`
    })

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
    const selectedVoice = options.voice ?? (await this.getBestVoice(options.gender)) ?? (await this.getVoices())[0]

    const ttsOptions: Required<TTSOptions> = {
      rate: options.rate ?? 0.9, // Natural speaking pace
      pitch: options.pitch ?? 1.0,
      volume: options.volume ?? 0.85,
      voice: selectedVoice,
      lang: options.lang ?? 'en-US',
      gender: options.gender ?? 'neutral'
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
        rate: 0.85, // Slower for patient comprehension
        pitch: 1.05, // Slightly warmer tone
        volume: 0.85,
        gender: 'female' // Studies show patients prefer female voices for medical info
      },
      provider: {
        rate: 0.95, // Standard professional rate
        pitch: 1.0, // Neutral pitch
        volume: 0.85,
        gender: 'neutral' // Professional neutral
      },
      payer: {
        rate: 1.0, // Standard rate for data content
        pitch: 0.98, // Slightly lower pitch for authority
        volume: 0.85,
        gender: 'male' // Traditional business preference
      }
    }
  }
}

// Singleton instance for global use
export const ttsClient = new TextToSpeechClient()