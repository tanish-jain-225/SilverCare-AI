import { useState, useCallback, useEffect } from 'react';
import { voiceService } from '../utils/voice';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  const speak = useCallback(async (text, options = {}) => {
    if (!text) return;
    try {
      setIsSpeaking(true);
      await voiceService.speak(text, {
        ...options,
        onended: () => {
          setIsSpeaking(false);
          if (typeof options.onended === 'function') {
            options.onended();
          }
        },
      });
    } catch (error) {
      setIsSpeaking(false);
      console.error('Speech error:', error);
    }
  }, []);

  const listen = useCallback(async (language = 'en-US') => {
    try {
      setIsListening(true);
      const result = await voiceService.listen(language);
      return result;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    } finally {
      setIsListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    voiceService.stop();
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    speak,
    listen,
    stop,
  };
}