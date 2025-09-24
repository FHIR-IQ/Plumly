export class TTSService {
  private static instance: TTSService;
  private voices: SpeechSynthesisVoice[] = [];
  private utterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private initialize() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices
      const loadVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
        this.isInitialized = true;
      };

      loadVoices();

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getPreferredVoice(): SpeechSynthesisVoice | null {
    // Try to find a good English voice
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira - English (United States)',
      'Microsoft David - English (United States)',
      'Google UK English Female',
      'Google UK English Male'
    ];

    for (const voiceName of preferredVoices) {
      const voice = this.voices.find(v => v.name.includes(voiceName));
      if (voice) return voice;
    }

    // Fallback to any English voice
    const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Fallback to first available voice
    return this.voices[0] || null;
  }

  speak(
    text: string,
    options?: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
      onEnd?: () => void;
      onError?: (error: SpeechSynthesisErrorEvent) => void;
    }
  ): void {
    if (!this.isAvailable()) {
      console.warn('Speech synthesis is not available');
      options?.onError?.(new Event('NotSupported') as SpeechSynthesisErrorEvent);
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);

    // Set voice
    const voice = options?.voice || this.getPreferredVoice();
    if (voice) {
      this.utterance.voice = voice;
    }

    // Set options
    this.utterance.rate = options?.rate ?? 1.0;
    this.utterance.pitch = options?.pitch ?? 1.0;
    this.utterance.volume = options?.volume ?? 1.0;

    // Set event handlers
    if (options?.onEnd) {
      this.utterance.onend = options.onEnd;
    }

    if (options?.onError) {
      this.utterance.onerror = options.onError;
    }

    // Start speaking
    window.speechSynthesis.speak(this.utterance);
  }

  pause(): void {
    if (this.isAvailable() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.isAvailable() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  stop(): void {
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
      this.utterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.isAvailable() && window.speechSynthesis.speaking;
  }

  isPaused(): boolean {
    return this.isAvailable() && window.speechSynthesis.paused;
  }

  // Generate SSML for better pronunciation control
  generateSSML(text: string, options?: {
    emphasis?: 'strong' | 'moderate' | 'reduced';
    rate?: 'slow' | 'medium' | 'fast';
    breakTime?: string;
  }): string {
    let ssml = '<speak>';

    if (options?.rate) {
      ssml += `<prosody rate="${options.rate}">`;
    }

    if (options?.emphasis) {
      ssml += `<emphasis level="${options.emphasis}">`;
    }

    ssml += text;

    if (options?.breakTime) {
      ssml += `<break time="${options.breakTime}"/>`;
    }

    if (options?.emphasis) {
      ssml += '</emphasis>';
    }

    if (options?.rate) {
      ssml += '</prosody>';
    }

    ssml += '</speak>';

    return ssml;
  }
}

export default TTSService;