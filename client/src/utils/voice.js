export class VoiceService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      if (!text || text.trim() === '') {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();
      this.isSpeaking = true;

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = options.rate || 0.8;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (typeof options.onended === 'function') {
          options.onended();
        }
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        // Treat 'interrupted' errors as normal behavior, not actual errors
        if (event.error === 'interrupted') {
          if (typeof options.onended === 'function') {
            options.onended();
          }
          resolve();
        } else {
          reject(event);
        }
      };

      this.synthesis.speak(utterance);
    });
  }

  listen(language = 'en-US') {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;
      this.recognition.lang = language;
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        this.isListening = false;
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(event.error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getStatus() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
    };
  }
}

export const voiceService = new VoiceService();