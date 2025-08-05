import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

export function VoiceButton({ 
  onResult, 
  language = 'en-US', 
  className = '',
  size = 'md', // sm, md, lg, xl
  label = '',
  showFeedback = true,
  disabled = false, // new prop
  type = 'button', // <-- add type prop, default to button
  tabIndex = -1, // <-- default to -1 for form use
}) {
  const { isListening, isSpeaking, listen, stop } = useVoice();
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    if (isListening) {
      setFeedbackText('Listening...');
    } else if (isSpeaking) {
      setFeedbackText('Speaking...');
    } else {
      setFeedbackText('');
    }
  }, [isListening, isSpeaking]);

  const handleClick = async (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (isListening) {
      stop();
      return;
    }
    try {
      const result = await listen(language);
      if (result && onResult) {
        onResult(result);
      }
    } catch (error) {
      setFeedbackText('Could not recognize speech');
      setTimeout(() => setFeedbackText(''), 3000);
    }
  };

  const getIcon = () => {
    if (isSpeaking) return Volume2;
    if (isListening) return MicOff;
    return Mic;
  };

  const Icon = getIcon();

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 md:w-14 md:h-14',
    lg: 'w-14 h-14 md:w-16 md:h-16',
    xl: 'w-16 h-16 md:w-20 md:h-20'
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={disabled || isSpeaking}
        aria-disabled={disabled}
        tabIndex={tabIndex}
        type={type}
        aria-label={isListening ? "Stop listening" : isSpeaking ? "Speaking" : "Start voice command"}
        className={`
          inline-flex items-center justify-center ${sizeClasses[size]} rounded-full
          shadow-md
          ${isListening 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'}
          ${isSpeaking ? 'bg-green-600' : ''}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${disabled ? 'pointer-events-none opacity-50' : ''}
          ${className}
        `}
      >
        <Icon size={size === 'xl' ? 32 : size === 'lg' ? 28 : size === 'md' ? 24 : 20} />
      </button>
      {/* Feedback text removed for minimalist design */}
    </div>
  );
}